const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function createWindow() {
  const isDev = (await import('electron-is-dev')).default;

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
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

  // Remove header line
  lines.shift(); 
  // Remove separator line
  lines.shift();

  return lines.map(line => {
    const parts = line.split('|').map(p => p.trim());
    const id = parts[0];
    const name = parts[1];
    const status = parts[3].toLowerCase();
    const image = parts[4];
    
    return {
      id,
      name,
      status,
      image,
      size: 'N/A', 
      autostart: false, 
      sharedHome: false,
      init: false,
      nvidia: false,
      volumes: [],
    };
  });
}

ipcMain.handle('list-containers', async () => {
  try {
    const { stdout } = await execAsync('distrobox list --no-color');
    return parseListOutput(stdout);
  } catch (error) {
    console.error('Error listing distrobox containers:', error);
    // Forward the error message to the renderer process
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