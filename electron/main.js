
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');
const { exec } = require('child_process');
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
        let info;
        
        try {
            const { stdout } = await execAsync(`podman inspect ${name}`);
            info = JSON.parse(stdout)[0];
        } catch (e) {
            console.warn(`Could not inspect container ${name}:`, e.message);
            return null;
        }

        const args = info.Config?.Cmd || [];
        const findArg = (arg) => {
          const index = args.indexOf(arg);
          return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
        }

        const homeArg = findArg('--home');
        let homeStatus = "Shared";
        if (homeArg) {
            homeStatus = `Isolated`;
        }

        return {
            id: parts[0],
            name: name,
            status: status,
            image: parts[3],
            autostart: info.HostConfig?.RestartPolicy?.Name === 'always',
            home: homeStatus,
            init: args.includes('--init'),
            nvidia: args.includes('--nvidia'),
        };
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
    console.log('[DEBUG] Raw shared apps output:', `\n---\n${output}\n---`);
    const lines = output.trim().split('\n');
    return lines.map((line, index) => {
        if (!line.trim()) return null;
        const parts = line.split(':');
        if (parts.length < 2) return null;
        const name = parts[0].trim();
        const binaryPath = parts.slice(1).join(':').trim();
        return {
            id: `shared-app-${containerName}-${name.replace(/\s/g, '-')}-${index}`,
            name,
            container: containerName,
            binaryPath,
            type: 'app',
        };
    }).filter(Boolean);
}

function parseSharedBinaries(output, containerName) {
    console.log('[DEBUG] Raw shared binaries output:', `\n---\n${output}\n---`);
    const lines = output.trim().split('\n');
    return lines.map((line, index) => {
        if (!line.trim()) return null;
        const parts = line.split(':');
        if (parts.length < 2) return null;
        const name = parts[0].trim();
        const binaryPath = parts.slice(1).join(':').trim();
        return {
            id: `shared-bin-${containerName}-${name.replace(/\s/g, '-')}-${index}`,
            name,
            container: containerName,
            binaryPath,
            type: 'binary',
        };
    }).filter(Boolean);
}

function parseSearchableApps(output, packageManager) {
    console.log(`[DEBUG] Raw output for ${packageManager}:`, `\n---\n${output}\n---`);
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    return lines.map((line, index) => {
        let name, version = 'N/A', description = 'No description available.';
        try {
            const parts = line.trim().split(/\s+/);
            if (parts.length === 0) return null;
            
            switch (packageManager) {
                case 'dpkg':
                    if (parts.length < 2 || parts[0] !== 'ii') return null;
                    name = parts[1].split(':')[0]; // remove arch
                    version = parts[2];
                    description = parts.slice(3).join(' ');
                    break;
                case 'rpm':
                case 'dnf':
                case 'yum':
                     if (parts.length < 2) return null;
                    name = parts[0].split('.').slice(0, -1).join('.'); // remove arch from name
                    version = parts[1];
                    description = `Repo: ${parts[2] || 'N/A'}`;
                    break;
                case 'pacman':
                    if (parts.length < 2) return null;
                    name = parts[0];
                    version = parts[1];
                    break;
                case 'zypper':
                    if(parts.length < 5 || (parts[0].toLowerCase() !== 'i' && parts[0].toLowerCase() !== 'i+')) return null;
                    name = parts[2];
                    version = parts[4];
                    description = parts.slice(6).join(' ');
                    break;
                case 'apk':
                    // APK info output is just package names, sometimes with version
                    name = parts[0].replace(/-\d.*/, ''); // Attempt to strip version
                    version = parts[0].substring(name.length + 1) || 'N/A';
                    break;
                default:
                    name = parts[0];
                    version = parts[1] || 'N/A';
            }
        } catch (e) {
            console.error(`Error parsing line for ${packageManager}: "${line}"`, e);
            return null;
        }

        if (!name || name.trim() === '') return null;
        
        return {
            id: `s-app-${name.trim()}-${index}`,
            name: name.trim(),
            version: version.trim(),
            description: description.trim(),
            type: 'app',
        };
    }).filter(Boolean);
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
        if (volume.trim()) command += ` --volume "${volume.trim()}"`;
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
    const { stdout: appOutput } = await execAsync(`distrobox enter ${containerName} -- distrobox-export --list-apps`);
    const apps = parseSharedApps(appOutput, containerName);
    
    const { stdout: binOutput } = await execAsync(`distrobox enter ${containerName} -- distrobox-export --list-binaries`);
    const binaries = parseSharedBinaries(binOutput, containerName);

    return [...apps, ...binaries];
  } catch (error) {
    if (error.stderr && (error.stderr.includes("No apps exported") || error.stderr.includes("No binaries exported"))) {
        return [];
    }
    console.warn(`Error listing shared apps for ${containerName}:`, error.message);
    return [];
  }
});

ipcMain.handle('search-container-apps', async (event, { containerName, packageManager, query }) => {
  // Basic sanitation to prevent command injection.
  const escapedQuery = query.replace(/(["'$`\\])/g, '\\$1');
  let searchCommand;

  switch (packageManager) {
    case 'dpkg':
      searchCommand = `dpkg-query -W -f='ii \${binary:Package} \${Version} \${Description}\\n' | grep -i "${escapedQuery}"`;
      break;
    case 'rpm':
      searchCommand = `rpm -qa --queryformat '%{NAME} %{VERSION}-%{RELEASE} %{SUMMARY}\\n' | grep -i "${escapedQuery}"`;
      break;
    case 'dnf':
    case 'yum':
      searchCommand = `dnf list installed | grep -i "${escapedQuery}"`;
      break;
    case 'pacman':
      searchCommand = `pacman -Qs ${escapedQuery}`; 
      break;
    case 'zypper':
      searchCommand = `zypper se -i ${escapedQuery}`; 
      break;
    case 'apk':
        searchCommand = `apk info | grep -i "${escapedQuery}"`;
        break;
    default:
        searchCommand = `echo "Unsupported package manager"`;
  }

  try {
    const { stdout } = await execAsync(`distrobox enter ${containerName} -- sh -c "${searchCommand}"`);
    return parseSearchableApps(stdout, packageManager);
  } catch (error) {
    if (error.code === 1 && error.stdout === '') {
        return [];
    }
    console.warn(`Error searching for apps in ${containerName} with ${packageManager}:`, error.message);
    return [];
  }
});


ipcMain.handle('export-app', async (event, { containerName, appName, type }) => {
  try {
    const flag = type === 'app' ? '--app' : '--bin';
    const exportPath = type === 'binary' ? `--export-path "${app.getPath('home')}/.local/bin"` : '';
    const command = `distrobox enter ${containerName} -- distrobox-export ${flag} "${appName}" ${exportPath}`;
    await execAsync(command);
    return { success: true };
  } catch (error) {
    console.error(`Error exporting app ${appName} from ${containerName}:`, error);
    throw error;
  }
});

ipcMain.handle('unshare-app', async (event, { containerName, appName, type }) => {
  try {
    const flag = type === 'app' ? '--app' : '--bin';
    const exportPath = type === 'binary' ? `--export-path "${app.getPath('home')}/.local/bin"` : '';
    const command = `distrobox enter ${containerName} -- distrobox-export ${flag} "${appName}" --delete ${exportPath}`;
    await execAsync(command);
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
