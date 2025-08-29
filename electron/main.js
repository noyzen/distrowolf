
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
    if (lines.length < 2) {
        console.log('DEBUG: No container data lines found.');
        return [];
    }
    // Skip header line
    const dataLines = lines.slice(1);
    return dataLines.map(line => {
        // Split by the pipe character
        const parts = line.split('|').map(p => p.trim());
        // Expecting 4 parts: ID | NAME | STATUS | IMAGE
        if (parts.length < 4) {
            console.log(`DEBUG: Skipping invalid line: "${line}" (expected 4 parts, got ${parts.length})`);
            return null;
        }
        const status = parts[2].toLowerCase().startsWith('up') ? 'running' : 'stopped';
        const container = {
            id: parts[0],
            name: parts[1],
            status: status,
            image: parts[3],
            // These properties are not available from `distrobox list` and need other commands
            size: 'N/A', 
            autostart: false, // Placeholder
            sharedHome: false, // Placeholder
            init: false, // Placeholder
            nvidia: false, // Placeholder
            volumes: [], // Placeholder
        };
        console.log(`DEBUG: Parsed container: ${JSON.stringify(container)}`);
        return container;
    }).filter(Boolean); // Filter out any null entries from invalid lines
}


ipcMain.handle('list-containers', async () => {
  console.log('DEBUG: Received "list-containers" event.');
  try {
    const { stdout, stderr } = await execAsync('distrobox list --no-color');
    if (stderr) {
      console.error('DEBUG: "distrobox list" stderr:', stderr);
    }
    console.log('DEBUG: Raw "distrobox list" stdout:\n---START---\n' + stdout + '---END---');
    const containers = parseListOutput(stdout);
    console.log('DEBUG: Parsed containers:', JSON.stringify(containers, null, 2));
    return containers;
  } catch (error) {
    console.error('DEBUG: Error listing distrobox containers:', error);
    throw error;
  }
});

ipcMain.handle('start-container', async (event, containerName) => {
  try {
    await execAsync(`distrobox enter ${containerName} -- "true"`);
    return { success: true };
  } catch (error) {
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
    await execAsync(`distrobox rm -f ${containerName}`);
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
      console.log(`Successfully launched with ${t.cmd}`);
      break; 
    } catch (e) {
      console.log(`Failed to launch with ${t.cmd}, trying next.`);
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
  // Placeholder for getting detailed info.
  // We can eventually parse `podman inspect` or similar.
  console.log(`Info requested for ${containerName}`);
  return {
    success: true,
    message: `Info for ${containerName} is not yet implemented.`,
  };
});

ipcMain.handle('save-as-image', async (event, containerName) => {
    try {
        const imageName = `distrowolf-backup-${containerName}-${Date.now()}`;
        // Using podman commit as it's the backend for distrobox
        await execAsync(`podman commit ${containerName} ${imageName}`);
        return { success: true, imageName };
    } catch (error) {
        console.error(`Error saving container ${containerName} as image:`, error);
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
