export interface Container {
  id: string;
  name: string;
  status: 'running' | 'stopped';
  image: string;
  size: string; // This will be dynamic, maybe we remove it or calculate it later.
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
