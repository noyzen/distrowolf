
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const Store = require('electron-store');
const clipboard = require('electron').clipboard;

const execAsync = promisify(exec);
const store = new Store();

async function createWindow() {
  const isDev = (await import('electron-is-dev')).default;

  const win = new BrowserWindow({
    width: store.get('windowBounds.width', 1200),
    height: store.get('windowBounds.height', 800),
    x: store.get('windowBounds.x'),
    y: store.get('windowBounds.y'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  win.setMenu(null);

  win.on('resize', () => {
    store.set('windowBounds', win.getBounds());
  });
  
  win.on('move', () => {
    store.set('windowBounds', win.getBounds());
  });

  const loadUrl = isDev
    ? 'http://localhost:9002'
    : `file://${path.join(__dirname, '../out/index.html')}`;
    
  win.loadURL(loadUrl);

  if (isDev) {
    win.webContents.openDevTools();
  }
}

async function parseListOutput(output) {
    const lines = output.trim().split('\n');
    if (lines.length < 2) return [];
    
    const dataLines = lines.slice(1);
    const containers = await Promise.all(dataLines.map(async line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 4) return null;
        
        const status = parts[2].toLowerCase().startsWith('up') ? 'running' : 'stopped';
        const name = parts[1];

        let autostart = false;
        try {
            const { stdout } = await execAsync(`podman inspect ${name}`);
            const info = JSON.parse(stdout);
            if (info && info.length > 0) {
                autostart = info[0]?.HostConfig?.RestartPolicy?.Name === 'always';
            }
        } catch (e) {
            console.warn(`Could not inspect container ${name} for autostart status:`, e.message);
        }
        
        const container = {
            id: parts[0],
            name: name,
            status: status,
            image: parts[3],
            size: 'N/A', 
            autostart: autostart, 
            sharedHome: false, 
            init: false, 
            nvidia: false, 
            volumes: [], 
        };
        return container;
    }));

    return containers.filter(Boolean);
}

function parseLocalImages(output) {
    const lines = output.trim().split('\n');
    if (lines.length < 2) return [];
    const headerLine = lines[0];
    const dataLines = lines.slice(1);

    const repositoryIndex = headerLine.indexOf("REPOSITORY");
    const tagIndex = headerLine.indexOf("TAG");
    const idIndex = headerLine.indexOf("IMAGE ID");
    const createdIndex = headerLine.indexOf("CREATED");
    const sizeIndex = headerLine.indexOf("SIZE");


    return dataLines.map((line, index) => {
        const repository = line.substring(repositoryIndex, tagIndex).trim();
        const tag = line.substring(tagIndex, idIndex).trim();
        const imageID = line.substring(idIndex, createdIndex).trim();
        const created = line.substring(createdIndex, sizeIndex).trim();
        const size = line.substring(sizeIndex).trim();
        
        if (!repository || !imageID) return null;

        return {
            id: `img-${imageID.substring(0,12)}`,
            repository,
            tag,
            imageID,
            created,
            size,
        };
    }).filter(Boolean);
}

function parseSharedApps(output, containerName) {
  const lines = output.trim().split('\n');
  const apps = [];
  lines.forEach((line, index) => {
    if (line.trim()) {
      const parts = line.split(':');
      const name = parts[0].trim();
      const binaryPath = parts[1] ? parts[1].trim() : 'N/A';
      apps.push({
        id: `shared-${containerName}-${name}-${index}`,
        name: name,
        container: containerName,
        binaryPath: binaryPath
      });
    }
  });
  return apps;
}

function parseSearchableApps(output, packageManager, query) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    const packages = [];
    const normalizedQuery = query.toLowerCase();

    if (packageManager === 'dpkg') {
        let currentPackage = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // 'ii' is the status for an installed package in dpkg -l
            if (line.startsWith('ii')) { 
                if (currentPackage) {
                    packages.push(currentPackage);
                }
                const parts = line.split(/\s+/);
                const name = parts[1].split(':')[0]; // handle architecture like :amd64
                currentPackage = {
                    id: `s-app-${name}-${packages.length}`,
                    name: name,
                    version: parts[2],
                    description: parts.slice(4).join(' '),
                };
            } else if (currentPackage && line.startsWith(' ')) { // Description continuation lines start with a space
                currentPackage.description += ' ' + line.trim();
            } else {
                 if (currentPackage) {
                    packages.push(currentPackage);
                    currentPackage = null;
                 }
            }
        }
        if (currentPackage) {
            packages.push(currentPackage);
        }
        
        // Filter results after parsing to ensure relevance
        return packages.filter(p => p.name && p.name.toLowerCase().includes(normalizedQuery));

    } else {
      // Generic parser for other package managers
      return lines.map((line, index) => {
          let name, version = 'N/A', description = 'N/A';
          try {
              const parts = line.trim().split(/\s+/);
              if (parts.length === 0) return null;

              switch (packageManager) {
                  case 'rpm':
                      // rpm -qa format can be just the name-version-release string
                      const rpmParts = parts[0].match(/(.+)-([^-]+)-([^-]+)/);
                      if (rpmParts) {
                          name = rpmParts[1];
                          version = `${rpmParts[2]}-${rpmParts[3]}`;
                      } else {
                          name = parts[0];
                      }
                      description = 'RPM Package';
                      break;
                  case 'dnf': case 'yum':
                       name = parts[0].split('.').slice(0, -1).join('.');
                       version = parts[1];
                       description = parts.length > 2 ? `Repo: ${parts[2]}` : 'Installed package';
                       break;
                  case 'pacman':
                      name = parts[0];
                      version = parts[1];
                      description = 'Arch Package';
                      break;
                  case 'zypper':
                      if(parts.length < 5 || (parts[0].toLowerCase() !== 'i' && parts[0].toLowerCase() !== 'i+')) return null;
                      name = parts[2];
                      version = parts[4];
                      description = parts.slice(6).join(' ');
                      break;
                  case 'apk':
                      name = parts[0];
                      version = 'N/A'; // apk info doesn't provide version in a simple list
                      description = 'Alpine Package';
                      break;
                  case 'equery': name = parts[0]; description = line; break;
                  case 'xbps-query':
                      const xbpsParts = parts[0].split('-');
                      name = xbpsParts.slice(0, -2).join('-');
                      version = xbpsParts.slice(-2).join('-');
                      description = parts.slice(1).join(' ');
                      break;
                  case 'nix-env': case 'guix': case 'slack':
                       name = parts[0]; description = line; break;
                   case 'eopkg':
                       name = parts[0]; description = parts.slice(1).join(' '); break;
                  case 'flatpak':
                      name = parts[1]; version = parts[2]; description = `ID: ${parts[0]}`; break;
                  case 'snap':
                      name = parts[0]; version = parts[1]; description = parts.slice(3).join(' '); break;
                  default: return null;
              }
          } catch (e) {
              console.error(`Error parsing line for ${packageManager}: "${line}"`, e);
              return null;
          }

          if (!name || name.trim() === '') return null;
          
          // Final filter for all other package managers
          if (!name.toLowerCase().includes(normalizedQuery)) return null;

          return {
              id: `s-app-${name.trim()}-${index}`,
              name: name.trim(),
              version: (version || 'N/A').trim(),
              description: (description || 'No description available.').trim(),
          };
      }).filter(Boolean);
    }
}


ipcMain.handle('check-dependencies', async () => {
  const checkCmd = async (cmd) => {
    try {
      await execAsync(`command -v ${cmd}`);
      return true;
    } catch (error) {
      return false;
    }
  };
  const distroboxInstalled = await checkCmd('distrobox');
  const podmanInstalled = await checkCmd('podman');
  return { distroboxInstalled, podmanInstalled };
});

ipcMain.handle('get-system-info', async () => {
    const getInfo = async (cmd, parser) => {
        try {
            const { stdout } = await execAsync(cmd);
            return parser(stdout.trim());
        } catch (error) {
            console.error(`Error getting info with command "${cmd}":`, error);
            return 'Not available';
        }
    };

    const distro = await getInfo("grep '^PRETTY_NAME=' /etc/os-release | cut -d'=' -f2 | tr -d '\"'", val => val);
    const distroboxVersion = await getInfo("distrobox --version", val => val);
    const podmanVersion = await getInfo("podman --version", val => val.split('version ')[1]);
    
    return { distro, distroboxVersion, podmanVersion };
});

ipcMain.handle('list-local-images', async () => {
    try {
        const { stdout } = await execAsync('podman images');
        return parseLocalImages(stdout);
    } catch (error) {
        console.error('Error listing podman images:', error);
        throw error;
    }
});


ipcMain.handle('pull-image', async (event, imageName) => {
    try {
        await execAsync(`podman pull ${imageName}`);
        return { success: true };
    } catch (error) {
        console.error(`Error pulling image ${imageName}:`, error);
        throw error;
    }
});

ipcMain.handle('delete-image', async (event, imageId) => {
    try {
        await execAsync(`podman rmi -f ${imageId}`);
        return { success: true };
    } catch(error) {
        console.error(`Error deleting image ${imageId}:`, error);
        throw error;
    }
});

ipcMain.handle('import-image', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Import Image from .tar',
        buttonLabel: 'Import',
        properties: ['openFile'],
        filters: [{ name: 'TAR Archives', extensions: ['tar'] }],
    });

    if (canceled || filePaths.length === 0) {
        return { success: false, cancelled: true };
    }

    const filePath = filePaths[0];
    try {
        const { stdout, stderr } = await execAsync(`podman load -i "${filePath}"`);
        if (stderr.toLowerCase().includes('already exists')) {
             return { success: false, cancelled: false, error: 'Image already exists.' };
        }
        return { success: true, cancelled: false, path: filePath };
    } catch (error) {
        if (error.stderr && error.stderr.toLowerCase().includes('already exists')) {
            return { success: false, cancelled: false, error: 'Image already exists.' };
        }
        console.error(`Error loading image from ${filePath}:`, error);
        throw error;
    }
});

ipcMain.handle('export-image', async (event, image) => {
    const defaultName = `${image.repository.replace(/[\/:]/g, '_')}_${image.tag}.tar`;
    const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'Export Image to .tar',
        buttonLabel: 'Export',
        defaultPath: defaultName,
        filters: [{ name: 'TAR Archives', extensions: ['tar'] }],
    });

    if (canceled || !filePath) {
        return { success: false, cancelled: true };
    }

    try {
        const imageName = `${image.repository}:${image.tag}`;
        await execAsync(`podman save -o "${filePath}" ${imageName}`);
        return { success: true, cancelled: false, path: filePath };
    } catch (error) {
        console.error(`Error saving image ${image.id} to ${filePath}:`, error);
        throw error;
    }
});

ipcMain.handle('create-container', async (event, { name, image, home, init, nvidia, volumes }) => {
    let command = `distrobox create --name ${name} --image "${image}"`;
    if (home && home.trim() !== '') command += ` --home "${home}"`;
    if (init) command += ' --init';
    if (nvidia) command += ' --nvidia';
    volumes.forEach(volume => {
        command += ` --volume "${volume}"`;
    });

    try {
        console.log(`Executing create command: ${command}`);
        await execAsync(command);
        return { success: true };
    } catch (error) {
        console.error(`Error creating container ${name}:`, error);
        throw error;
    }
});


ipcMain.handle('list-containers', async () => {
  try {
    const { stdout } = await execAsync('distrobox list --no-color');
    return parseListOutput(stdout);
  } catch (error) {
    console.error('Error listing distrobox containers:', error);
    throw error;
  }
});

ipcMain.handle('start-container', async (event, containerName) => {
  try {
    await execAsync(`distrobox enter ${containerName} -- true`);
    return { success: true };
  } catch (error) {
    if (error.stderr && (error.stderr.includes("is already running") || error.stderr.includes("Container Setup Complete"))) {
        return { success: true };
    }
    console.error(`Error starting container ${containerName}:`, error);
    throw error;
  }
});

ipcMain.handle('stop-container', async (event, containerName) => {
  try {
    await execAsync(`distrobox stop ${containerName} --yes`);
    return { success: true };
  } catch (error) {
    console.error(`Error stopping container ${containerName}:`, error);
    throw error;
  }
});

ipcMain.handle('delete-container', async (event, containerName) => {
  try {
    await execAsync(`distrobox rm ${containerName} --force --yes`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting container ${containerName}:`, error);
    throw error;
  }
});


ipcMain.handle('enter-container', (event, containerName) => {
    const command = `distrobox enter ${containerName}`;
    return { success: true, message: command };
});

ipcMain.handle('copy-to-clipboard', (event, text) => {
    clipboard.writeText(text);
    return { success: true };
});

ipcMain.handle('info-container', async (event, containerName) => {
  try {
    const { stdout } = await execAsync(`podman inspect ${containerName}`);
    const info = JSON.parse(stdout);
    return { success: true, message: JSON.stringify(info[0], null, 2) };
  } catch(error) {
     console.error(`Error getting info for ${containerName}:`, error);
     throw error;
  }
});

ipcMain.handle('save-as-image', async (event, containerName) => {
    try {
        const imageName = `distrowolf-backup-${containerName}-${Date.now()}`;
        await execAsync(`podman commit ${containerName} ${imageName}`);
        return { success: true, imageName };
    } catch (error) {
        console.error(`Error saving container ${containerName} as image:`, error);
        throw error;
    }
});

ipcMain.handle('toggle-autostart', async (event, containerName, autostart) => {
    const policy = autostart ? 'always' : 'no';
    try {
        await execAsync(`podman update --restart=${policy} ${containerName}`);
        return { success: true };
    } catch (error) {
        console.error(`Error setting autostart for ${containerName}:`, error);
        throw error;
    }
});


ipcMain.handle('list-shared-apps', async (event, containerName) => {
  try {
    const { stdout } = await execAsync(`distrobox enter ${containerName} -- distrobox-export --list-apps`);
    return parseSharedApps(stdout, containerName);
  } catch (error) {
    console.error(`Error listing shared apps for ${containerName}:`, error);
    return [];
  }
});

ipcMain.handle('search-container-apps', async (event, { containerName, packageManager, query }) => {
  let searchCommand;
  // Escape only shell-special characters for security
  const escapedQuery = query.replace(/(["'$`\\])/g, '\\$1');

  switch (packageManager) {
    case 'dpkg':
      searchCommand = `dpkg-query -l '*${escapedQuery}*'`;
      break;
    case 'rpm':
      searchCommand = `rpm -qa '*${escapedQuery}*'`;
      break;
    case 'dnf':
      searchCommand = `dnf list installed '*${escapedQuery}*'`;
      break;
    case 'yum':
      searchCommand = `yum list installed '*${escapedQuery}*'`;
      break;
    case 'pacman':
      searchCommand = `pacman -Qs "${escapedQuery}"`; // -s for search
      break;
    case 'zypper':
      searchCommand = `zypper se -i '*${escapedQuery}*'`;
      break;
    case 'apk':
        searchCommand = `apk info -e '*${escapedQuery}*'`; // -e for exact match with wildcards
        break;
    case 'equery':
        searchCommand = `equery list "*${escapedQuery}*"`;
        break;
    case 'xbps-query':
        searchCommand = `xbps-query -Rs "${escapedQuery}"`; // -R for repository search
        break;
    case 'nix-env':
        searchCommand = `nix-env -q | grep -i "${escapedQuery}"`;
        break;
    case 'guix':
        searchCommand = `guix package --list-installed | grep -i "${escapedQuery}"`;
        break;
    case 'slack':
        searchCommand = `ls /var/log/packages | grep -i "${escapedQuery}"`;
        break;
    case 'eopkg':
        searchCommand = `eopkg li | grep -i "${escapedQuery}"`;
        break;
    case 'flatpak':
        searchCommand = `flatpak list | grep -i "${escapedQuery}"`;
        break;
    case 'snap':
        searchCommand = `snap list | grep -i "${escapedQuery}"`;
        break;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }

  try {
    const { stdout } = await execAsync(`distrobox enter ${containerName} -- sh -c "${searchCommand}"`);
    return parseSearchableApps(stdout, packageManager, query);
  } catch (error) {
    // Grep and other tools might return exit code 1 if no lines are found, which throws an error.
    // We can safely ignore this and return an empty array.
    if (error.code === 1 && error.stdout === '') {
        return [];
    }
    console.warn(`Error searching for apps in ${containerName} with ${packageManager}:`, error.message);
    // Also return empty on other errors to prevent crash
    return [];
  }
});


ipcMain.handle('export-app', async (event, { containerName, appName }) => {
  try {
    await execAsync(`distrobox enter ${containerName} -- distrobox-export --app ${appName}`);
    return { success: true };
  } catch (error) {
    console.error(`Error exporting app ${appName} from ${containerName}:`, error);
    throw error;
  }
});

ipcMain.handle('unshare-app', async (event, { containerName, appName }) => {
  try {
    await execAsync(`distrobox enter ${containerName} -- distrobox-export --app ${appName} --delete`);
    return { success: true };
  } catch (error) {
    console.error(`Error unsharing app ${appName} from ${containerName}:`, error);
    throw error;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
