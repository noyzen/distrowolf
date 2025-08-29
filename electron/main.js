
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const Store = require('electron-store');

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

function parseListOutput(output) {
    const lines = output.trim().split('\n');
    if (lines.length < 2) return [];
    
    const dataLines = lines.slice(1);
    const containers = dataLines.map(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 4) return null;
        
        const status = parts[2].toLowerCase().startsWith('up') ? 'running' : 'stopped';
        
        const container = {
            id: parts[0],
            name: parts[1],
            status: status,
            image: parts[3],
            size: 'N/A', 
            autostart: false, 
            sharedHome: false, 
            init: false, 
            nvidia: false, 
            volumes: [], 
        };
        return container;
    }).filter(Boolean);

    return containers;
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

function parseSharedApps(output) {
  const lines = output.trim().split('\n').slice(2); // Skip headers
  const apps = [];
  lines.forEach(line => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length >= 3) {
      apps.push({
        id: `shared-${parts[0]}-${parts[1]}`,
        name: parts[1],
        container: parts[0],
        binaryPath: parts[2]
      });
    }
  });
  return apps;
}

function parseSearchableApps(output, packageManager) {
    const lines = output.trim().split('\n');
    return lines.map((line, index) => {
        const parts = line.split(/\s+/);
        if (parts.length < 2) return null;
        let name, version;

        if (packageManager === 'apt') {
            const [pkg, ver] = parts[0].split('/');
            name = pkg;
            version = ver;
        } else { // dnf, pacman
            name = parts[0];
            version = parts[1];
        }
        
        if (!name || !version) return null;

        return {
            id: `s-app-${name}-${index}`,
            name,
            version,
            description: parts.slice(2).join(' ')
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
        console.log(`Pulling image: ${imageName}`);
        await execAsync(`podman pull ${imageName}`);
        return { success: true };
    } catch (error) {
        console.error(`Error pulling image ${imageName}:`, error);
        throw error;
    }
});

ipcMain.handle('create-container', async (event, { name, image, home, init, nvidia, volumes }) => {
    let command = `distrobox create --name ${name} --image "${image}"`;
    if (home) command += ` --home "${home}"`;
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
    // Use "true" as a no-op command to just start the container
    await execAsync(`distrobox enter ${containerName} -- "true"`);
    return { success: true };
  } catch (error) {
    console.error(`Error starting container ${containerName}:`, error);
    // Even if it fails, it might have started, let's not re-throw immediately
    // The UI will refresh and show the current state.
    if (error.stderr && error.stderr.includes("is already running")) {
        return { success: true };
    }
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
    // The --yes flag is needed for non-interactive deletion
    await execAsync(`distrobox rm -f --yes ${containerName}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting container ${containerName}:`, error);
    throw error;
  }
});


ipcMain.handle('enter-container', (event, containerName) => {
  const terminals = [
    { cmd: 'gnome-terminal', args: ['--', 'distrobox', 'enter', containerName] },
    { cmd: 'konsole', args: ['-e', 'distrobox', 'enter', containerName] },
    { cmd: 'xfce4-terminal', args: ['-e', 'distrobox enter ' + containerName] },
    { cmd: 'xterm', args: ['-e', 'distrobox', 'enter', containerName] },
  ];

  let spawned = false;
  for (const t of terminals) {
    try {
      spawn(t.cmd, t.args, { detached: true, stdio: 'ignore' }).unref();
      spawned = true;
      break; 
    } catch (e) {
      // Ignore and try next
    }
  }
  
  if (spawned) {
    return { success: true };
  } else {
     const error = new Error('Could not find a compatible terminal to open.');
     console.error(error);
     throw error;
  }
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

ipcMain.handle('list-shared-apps', async (event, containerName) => {
  try {
    const { stdout } = await execAsync(`distrobox list --show-exports --no-color`);
    const allApps = parseSharedApps(stdout);
    const containerApps = allApps.filter(app => app.container === containerName);
    return containerApps;
  } catch (error) {
    console.error(`Error listing shared apps for ${containerName}:`, error);
    throw error;
  }
});

ipcMain.handle('search-container-apps', async (event, { containerName, packageManager, query }) => {
  let searchCommand;
  switch (packageManager) {
    case 'apt':
      searchCommand = `apt list --installed ${query}*`;
      break;
    case 'dnf':
      searchCommand = `dnf list installed ${query}*`;
      break;
    case 'pacman':
      searchCommand = `pacman -Qs ${query}`;
      break;
    default:
      throw new Error(`Unsupported package manager: ${packageManager}`);
  }

  try {
    const { stdout } = await execAsync(`distrobox enter ${containerName} -- "${searchCommand}"`);
    return parseSearchableApps(stdout, packageManager);
  } catch (error) {
    // If command fails (e.g. no results), return empty array instead of throwing
    console.warn(`Error searching for apps in ${containerName} with ${packageManager}:`, error.message);
    return [];
  }
});


ipcMain.handle('export-app', async (event, { containerName, appName }) => {
  try {
    await execAsync(`distrobox-export --app ${appName} -c ${containerName} --export-path ~/.local/bin`);
    return { success: true };
  } catch (error) {
    console.error(`Error exporting app ${appName} from ${containerName}:`, error);
    throw error;
  }
});

ipcMain.handle('unshare-app', async (event, { containerName, appName }) => {
  try {
    await execAsync(`distrobox-export --app ${appName} -c ${containerName} --unexport`);
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
