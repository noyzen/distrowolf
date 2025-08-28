import { exec } from 'child_process';
import { promisify } from 'util';
import type { Container } from './types';

const execAsync = promisify(exec);

export async function listContainers(): Promise<Container[]> {
  try {
    const { stdout } = await execAsync('distrobox list --no-color');
    return parseListOutput(stdout);
  } catch (error) {
    console.error('Error listing distrobox containers:', error);
    // An error might mean distrobox is not installed or the command failed.
    // We'll return an empty array and let the UI handle the "not found" state.
    throw error;
  }
}

function parseListOutput(output: string): Container[] {
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
    const status = parts[3].toLowerCase() as 'running' | 'stopped';
    const image = parts[4];
    
    // The other properties are not available in `distrobox list`
    // We will have to get them from `distrobox-show` or other commands later.
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
