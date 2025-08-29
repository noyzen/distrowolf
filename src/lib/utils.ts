
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const distroIconMap: { [key: string]: string } = {
  ubuntu: 'fl-ubuntu',
  debian: 'fl-debian',
  fedora: 'fl-fedora',
  'fedora-toolbox': 'fl-fedora',
  arch: 'fl-archlinux',
  'arch-toolbox': 'fl-archlinux',
  archlinux: 'fl-archlinux',
  centos: 'fl-centos',
  'centos-toolbox': 'fl-centos',
  opensuse: 'fl-opensuse',
  'suse': 'fl-opensuse',
  mint: 'fl-linuxmint',
  manjaro: 'fl-manjaro',
  rhel: 'fl-redhat',
  redhat: 'fl-redhat',
  gentoo: 'fl-gentoo',
  void: 'fl-void',
  slackware: 'fl-slackware',
  solus: 'fl-solus',
  nixos: 'fl-nixos',
  popos: 'fl-pop-os',
  'pop-os': 'fl-pop-os',
  elementary: 'fl-elementary',
  kali: 'fl-kali-linux',
  parrot: 'fl-parrot',
  rocky: 'fl-rocky-linux',
  rockylinux: 'fl-rocky-linux',
  almalinux: 'fl-almalinux',
  oracle: 'fl-tux', 
  'oraclelinux': 'fl-tux',
  mageia: 'fl-mageia',
  tumbleweed: 'fl-tumbleweed',
  leap: 'fl-leap',
  docker: 'fl-docker',
  'bazzite-arch': 'fl-garuda',
  bluefin: 'fl-tux',
  wolfi: 'fl-tux',
  kubuntu: 'fl-kubuntu',
  garuda: 'fl-garuda',
  endeavour: 'fl-endeavour',
  alpine: 'fl-alpine',
  amazon: 'fl-tux',
  amazonlinux: 'fl-tux',
  ubi: 'fl-redhat', // RedHat Universal Base Image
  default: 'fl-tux',
};

export function getDistroIcon(imageName: string): string {
    if (!imageName) return distroIconMap.default;

    // e.g. "quay.io/toolbx-images/debian-toolbox:12" -> "debian"
    // e.g. "ghcr.io/ublue-os/bluefin-cli:latest" -> "bluefin"
    const lowerCaseName = imageName.toLowerCase();
    
    // Check for specific keywords first
    for (const distro in distroIconMap) {
        if (lowerCaseName.includes(distro)) {
            return distroIconMap[distro];
        }
    }
    
    // Fallback parsing if no direct keyword match
    const parts = lowerCaseName.split(/[/:-]/);
    for (const distro in distroIconMap) {
        if (parts.some(part => part === distro)) {
            return distroIconMap[distro];
        }
    }

    return distroIconMap.default;
}
