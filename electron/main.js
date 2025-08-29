
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');
const { exec } = require('child_process');
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
  if (lines.length <= 1) {
    return [];
  }

  // Remove header and separator lines
  const dataLines = lines.slice(2);

  return dataLines.map(line => {
    // Split by '|' and trim whitespace
    const parts = line.split('|').map(p => p.trim());
    
    // Ensure the line has the expected number of parts
    if (parts.length < 5) return null;

    return {
      id: parts[0],
      name: parts[1],
      status: parts[3].toLowerCase(),
      image: parts[4],
      // These are placeholders for now as 'distrobox list' doesn't provide them
      size: 'N/A', 
      autostart: false, 
      sharedHome: false,
      init: false,
      nvidia: false,
      volumes: [],
    };
  }).filter(Boolean); // Filter out any null entries from invalid lines
}

ipcMain.handle('list-containers', async () => {
  console.log('DEBUG: Received "list-containers" event.');
  try {
    // --no-color is important to ensure consistent output for parsing
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
    // Forward the error message to the renderer process
    throw error;
  }
});

ipcMain.handle('start-container', async (event, containerName) => {
  try {
    // A simple, non-interactive command to ensure the container starts
    await execAsync(`distrobox enter ${containerName} -- "true"`); 
    return { success: true };
  } catch (error) {
    console.error(`Error starting container ${containerName}:`, error);
    throw error;
  }
});

ipcMain.handle('stop-container', async (event, containerName) => {
  try {
    await execAsync(`distrobox stop -f ${containerName}`); // Use -f to force stop
    return { success: true };
  } catch (error) {
    console.error(`Error stopping container ${containerName}:`, error);
    throw error;
  }
});

ipcMain.handle('delete-container', async (event, containerName) => {
  try {
    // Use -f to force deletion without interactive prompts
    await execAsync(`distrobox rm -f ${containerName}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting container ${containerName}:`, error);
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
