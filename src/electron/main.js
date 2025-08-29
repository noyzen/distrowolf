
const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const Store = require('electron-store');
const clipboard = require('electron').clipboard;
const fs = require('fs');

const execAsync = promisify(exec);
const store = new Store();

function createWindow() {
  const isDev = !app.isPackaged;

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
    
    const hostHome = app.getPath('home');
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

        const env = info.Config?.Env || [];
        const findEnvValue = (key) => {
            const entry = env.find(e => e.startsWith(`${key}=`));
            return entry ? entry.split('=')[1] : null;
        };
        
        const distroboxHostHome = findEnvValue('DISTROBOX_HOST_HOME');
        const containerHome = findEnvValue('HOME');
        
        let homeInfo;
        if (distroboxHostHome) {
            homeInfo = { type: "Isolated", path: containerHome };
        } else {
            homeInfo = { type: "Shared", path: hostHome };
        }

        return {
            id: parts[0],
            name: name,
            status: status,
            image: parts[3],
            autostart: info.HostConfig?.RestartPolicy?.Name === 'always',
            home: homeInfo,
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
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 2) return null;
        const name = parts[0];
        const binaryPath = parts[1];
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
        const parts = line.split('|').map(p => p.trim());
        if (parts.length < 2) return null;
        const name = parts[0];
        const binaryPath = parts[1];
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
                    name = parts[1].split(':')[0];
                    version = parts[2];
                    description = parts.slice(3).join(' ');
                    break;
                case 'rpm':
                case 'dnf':
                case 'yum':
                    if (parts.length < 2) return null;
                    name = parts[0].split('.').slice(0, -1).join('.') || parts[0];
                    version = parts[1];
                    description = `Repo: ${parts[2] || 'N/A'}`;
                    break;
                case 'pacman':
                    if (parts.length < 2) return null;
                    name = parts[0].split('/')[1] || parts[0]; // handles 'local/firefox'
                    version = parts[1];
                    break;
                case 'zypper':
                    const zypperParts = line.split('|').map(p => p.trim());
                    if(zypperParts.length < 4 || !zypperParts[0].toLowerCase().includes('i')) return null;
                    name = zypperParts[1];
                    version = zypperParts[3];
                    description = zypperParts[2];
                    break;
                case 'apk':
                    name = parts[0].replace(/-\\d.*/, '');
                    version = parts[0].substring(name.length + 1) || 'N/A';
                    break;
                case 'snap':
                    if (parts.length < 2 || line.toLowerCase().startsWith('name')) return null; // Skip header
                    name = parts[0];
                    version = parts[1];
                    description = `Rev: ${parts[2]}, Publisher: ${parts[4]}`;
                    break;
                case 'flatpak':
                     if (parts.length < 2 || line.toLowerCase().startsWith('name')) return null; // Skip header
                    name = parts[0];
                    version = parts[2];
                    description = `App ID: ${parts[1]}`;
                    break;
                case 'equery':
                     if (parts.length < 1) return null;
                     name = parts[0].split('/')[1] || parts[0];
                     version = name.split('-').pop() || 'N/A';
                     name = name.replace(`-${version}`, '');
                     break;
                default: // Generic fallback for grep-based results
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

function getDistroInfo() {
    if (!fs.existsSync('/etc/os-release')) {
        return { id: 'unknown', name: 'Unknown Linux' };
    }
    const osRelease = fs.readFileSync('/etc/os-release', 'utf-8');
    const lines = osRelease.split('\n');
    const info = {};
    lines.forEach(line => {
        if (line) {
            const [key, value] = line.split('=');
            if (key && value) {
                info[key.trim()] = value.trim().replace(/"/g, '');
            }
        }
    });
    return { id: info.ID || 'unknown', name: info.PRETTY_NAME || 'Unknown Linux' };
}

const checkCmd = async (cmd) => {
    try {
        await execAsync(`command -v ${cmd}`);
        return true;
    } catch (error) {
        return false;
    }
};

async function detectTerminal() {
    const terminals = [
        'ptyxis',
        'konsole',
        'gnome-terminal',
        'xfce4-terminal',
        'mate-terminal',
        'lxterminal',
        'qterminal',
        'io.elementary.terminal',
        'terminator',
        'tilix',
        'alacritty',
        'kitty',
    ];
    for (const term of terminals) {
        if (await checkCmd(term)) {
            return term;
        }
    }
    return null;
}

ipcMain.handle('check-dependencies', async () => {
    const distroboxInstalled = await checkCmd('distrobox');
    const podmanInstalled = await checkCmd('podman');
    const dockerInstalled = await checkCmd('docker');
    const detectedTerminal = await detectTerminal();
    const distroInfo = getDistroInfo();

    return {
        distroboxInstalled,
        podmanInstalled,
        dockerInstalled,
        detectedTerminal,
        distroInfo,
    };
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
        if (stderr && stderr.toLowerCase().includes('already exists')) {
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

ipcMain.handle('create-container', async (event, { name, image, home, volumes, init, nvidia }) => {
    console.log('[DEBUG] Received create-container request with options:', { name, image, home, volumes, init, nvidia });
    let command = `distrobox create --name ${name} --image "${image}"`;
    if (home && home.trim() !== '') command += ` --home "${home}"`;
    if (init) command += ' --init';
    if (nvidia) command += ' --nvidia';
    volumes.forEach(volume => {
        if (volume.trim()) command += ` --volume "${volume.trim()}"`;
    });

    try {
        console.log(`[DEBUG] Executing create command: ${command}`);
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
  } catch (error).