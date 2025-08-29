
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
      // Don't throw here, as some info might still be in stdout
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
    // Using `distrobox enter` with a non-interactive command is a reliable way to start it
    await execAsync(`distrobox enter ${containerName} -- "true"`);
    return { success: true };
  } catch (error) {
    console.error(`Error starting container ${containerName}:`, error);
    throw error;
  }
});

ipcMain.handle('stop-container', async (event, containerName) => {
  try {
    // Use --yes to avoid interactive prompts
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
  try {
    // This is platform-specific. This example works for terminals like gnome-terminal,
    // konsole, etc. It might need adjustments for other terminals or OSes.
    const terminal = process.env.TERMINAL || 'gnome-terminal';
    spawn(terminal, ['-e', `distrobox enter ${containerName}`], {
      detached: true,
      stdio: 'ignore'
    }).unref();
    return { success: true };
  } catch (error) {
    console.error(`Error entering container ${containerName}:`, error);
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
