
export type HomeInfo = {
  type: 'Shared' | 'Isolated';
  path: string | null;
};

export interface Container {
  id: string;
  name: string;
  status: 'running' | 'stopped';
  image: string;
  autostart: boolean;
  home: HomeInfo;
}

export interface LocalImage {
  id: string;
  repository: string;
  tag: string;
  imageID: string;
  size: string;
  created: string;
}

export interface SharedApp {
  id: string;
  name: string;
  container: string;
  binaryPath: string;
  type: 'app' | 'binary';
}

export interface SearchableApp {
  id: string;
  name: string;
  version: string;
  description: string;
  type: 'app' | 'binary';
}

export interface SystemInfo {
    distro: string;
    distroboxVersion: string;
    podmanVersion: string;
}

export interface DependencyInfo {
  distroboxInstalled: boolean;
  podmanInstalled: boolean;
  dockerInstalled: boolean;
  weztermInstalled: boolean;
  detectedTerminal: string | null;
  distroInfo: {
    id: string;
    name: string;
  };
}
