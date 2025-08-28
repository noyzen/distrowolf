import type { Container, LocalImage, SharedApp, SearchableApp } from './types';

export const MOCK_CONTAINERS: Container[] = [
  {
    id: 'distrobox-1',
    name: 'ubuntu-dev',
    status: 'running',
    image: 'ubuntu:22.04',
    size: '4.2 GB',
    autostart: true,
    sharedHome: true,
    init: false,
    nvidia: true,
    volumes: ['/mnt/data:/data'],
  },
  {
    id: 'distrobox-2',
    name: 'fedora-test',
    status: 'stopped',
    image: 'fedora:38',
    size: '2.1 GB',
    autostart: false,
    sharedHome: false,
    init: true,
    nvidia: false,
    volumes: [],
  },
  {
    id: 'distrobox-3',
    name: 'arch-gaming',
    status: 'running',
    image: 'archlinux:latest',
    size: '3.5 GB',
    autostart: false,
    sharedHome: true,
    init: true,
    nvidia: true,
    volumes: ['/home/user/games:/games'],
  },
];

export const MOCK_LOCAL_IMAGES: LocalImage[] = [
  { id: 'img-1', repository: 'ubuntu', tag: '22.04', size: '1.2 GB', created: '3 weeks ago' },
  { id: 'img-2', repository: 'fedora', tag: '38', size: '890 MB', created: '1 month ago' },
  { id: 'img-3', repository: 'archlinux', tag: 'latest', size: '950 MB', created: '2 days ago' },
  { id: 'img-4', repository: 'alpine', tag: 'latest', size: '5 MB', created: '5 hours ago' },
];

export const MOCK_SHARED_APPS: SharedApp[] = [
  { id: 'app-1', name: 'Visual Studio Code', container: 'ubuntu-dev', binaryPath: '/usr/bin/code' },
  { id: 'app-2', name: 'Steam', container: 'arch-gaming', binaryPath: '/usr/bin/steam' },
  { id: 'app-3', name: 'GIMP', container: 'fedora-test', binaryPath: '/usr/bin/gimp' },
];

export const MOCK_SEARCHABLE_APPS: SearchableApp[] = [
  { id: 's-app-1', name: 'neovim', version: '0.9.1', description: 'Hyperextensible Vim-based text editor' },
  { id: 's-app-2', name: 'firefox', version: '118.0', description: 'Mozilla Firefox web browser' },
  { id: 's-app-3', name: 'blender', version: '3.6.2', description: '3D creation suite' },
  { id: 's-app-4', name: 'krita', version: '5.2.0', description: 'Professional free and open source painting program' },
];
