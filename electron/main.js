
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
  const lines = output.trim().split('\n');
  const apps = [];
  
  // Find the header line to correctly parse columns
  const headerIndex = lines.findIndex(line => line.includes("CONTAINER") && line.includes("APP/BINARY"));
  if (headerIndex === -1) return [];

  const dataLines = lines.slice(headerIndex + 2); // Skip header and separator line
  
  dataLines.forEach(line => {
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
        // Handle cases where there might not be a description
        if (parts.length < 1) return null;

        let name, version, description;

        if (packageManager === 'apt') {
            // Example: "adduser/now 3.118 all [installed,local]" or "zlib1g/now 1:1.2.11.dfsg-2ubuntu1.2 amd64 [installed,local]"
            const [pkgInfo, ...rest] = parts;
            const [pkgName] = pkgInfo.split('/');
            name = pkgName;
            version = "N/A"; // apt list doesn't show version cleanly here
            description = rest.join(' ');
        } else if (packageManager === 'dnf') {
            // Example: "zlib.x86_64  1.2.11-28.el8"
            if (parts.length < 2) return null;
            name = parts[0].split('.')[0]; // remove arch
            version = parts[1];
            description = parts.slice(2).join(' ');
        } else if (packageManager === 'pacman') {
            // Example: "core/zlib 1:1.2.13-2" and then on next line "    gzip ...""
            if(parts.length < 2) return null; // This might be a description line
            if (line.startsWith(' ')) return null; // Likely a description line
            name = parts[0].split('/')[1] || parts[0];
            version = parts[1];
            description = ""; // pacman -Qs doesn't give a one-line description
        } else {
            return null; // Unsupported for now
        }
        
        if (!name) return null;

        return {
            id: `s-app-${name}-${index}`,
            name,
            version: version || 'N/A',
            description: description || 'No description available.',
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
    // Using `true` is a common trick to start a container and have it exit immediately,
    // leaving it running in the background if it's daemonized (which distrobox containers are).
    await execAsync(`distrobox enter ${containerName} -- true`);
    return { success: true };
  } catch (error) {
     // Distrobox enter returns a non-zero exit code if the command fails, but the container might still start.
     // A better check is to see if the error indicates it's already running.
    if (error.stderr && error.stderr.includes("is already running")) {
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
    // The --yes flag is needed for non-interactive deletion
    await execAsync(`distrobox rm ${containerName} --force --yes`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting container ${containerName}:`, error);
    throw error;
  }
});


ipcMain.handle('enter-container', (event, containerName) => {
  // This command will be spawned in a new process, detached from the main app.
  const command = `distrobox enter ${containerName}`;

  // List of terminal emulators to try.
  const terminals = [
    { cmd: 'gnome-terminal', args: ['--', 'bash', '-c', command] },
    { cmd: 'konsole', args: ['-e', command] },
    { cmd: 'xfce4-terminal', args: ['-e', command] },
    { cmd: 'xterm', args: ['-e', command] },
    // Fallback for other terminals
    { cmd: 'x-terminal-emulator', args: ['-e', command] }
  ];

  let spawned = false;
  for (const t of terminals) {
    try {
      // We use spawn with detached:true and stdio:'ignore' to launch the terminal
      // as a completely separate process. This prevents the main app from hanging
      // or crashing if the terminal is closed.
      const child = spawn(t.cmd, t.args, { detached: true, stdio: 'ignore' });
      // unref() allows the main Node.js process to exit even if the child process is still running.
      child.unref();
      spawned = true;
      console.log(`Successfully launched terminal with: ${t.cmd}`);
      break; 
    } catch (e) {
      console.warn(`Could not launch terminal with ${t.cmd}, trying next.`);
    }
  }
  
  if (spawned) {
    return { success: true };
  } else {
     const error = new Error('Could not find a compatible terminal to open. Please open your terminal and run the command manually.');
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
    // If a container name is provided, filter for it. Otherwise, return all.
    const containerApps = containerName ? allApps.filter(app => app.container === containerName) : allApps;
    return containerApps;
  } catch (error) {
    console.error(`Error listing shared apps for ${containerName}:`, error);
    // Don't throw, just return empty list on error
    return [];
  }
});

ipcMain.handle('search-container-apps', async (event, { containerName, packageManager, query }) => {
  let searchCommand;
  switch (packageManager) {
    case 'apt':
      // Using apt-cache for better scripting compatibility
      searchCommand = `apt-cache search ${query}`;
      break;
    case 'dnf':
      searchCommand = `dnf search ${query}`;
      break;
    case 'pacman':
      searchCommand = `pacman -Ss ${query}`;
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
    await execAsync(`distrobox-export --app ${appName} -c ${containerName}`);
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
