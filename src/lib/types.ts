
export interface Container {
  id: string;
  name: string;
  status: 'running' | 'stopped';
  image: string;
  size: string;
  autostart: boolean;
  sharedHome: boolean;
  init: boolean;
  nvidia: boolean;
  volumes: string[];
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
}

export interface SearchableApp {
  id: string;
  name: string;
  version: string;
  description: string;
}

export interface SystemInfo {
    distro: string;
    distroboxVersion: string;
    podmanVersion: string;
}
