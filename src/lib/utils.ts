
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const distroIconMap: { [key: string]: string } = {
  almalinux: 'fl-almalinux',
  alpine: 'fl-alpine',
  amazonlinux: 'fl-tux', 
  aosc: 'fl-aosc',
  apple: 'fl-apple',
  archcraft: 'fl-archcraft',
  archlabs: 'fl-archlabs',
  arch: 'fl-archlinux',
  archlinux: 'fl-archlinux',
  arcolinux: 'fl-arcolinux',
  artix: 'fl-artix',
  fedora: 'fl-fedora',
  ubuntu: 'fl-ubuntu',
  debian: 'fl-debian',
  centos: 'fl-centos',
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
  oracle: 'fl-tux',
  'oraclelinux': 'fl-tux',
  mageia: 'fl-mageia',
  tumbleweed: 'fl-tumbleweed',
  leap: 'fl-leap',
  docker: 'fl-docker',
  'bazzite-arch': 'fl-garuda',
  'bluefin-cli': 'fl-tux',
  wolfi: 'fl-tux',
  kubuntu: 'fl-kubuntu',
  garuda: 'fl-garuda',
  endeavour: 'fl-endeavour',
  default: 'fl-tux',
};

export function getDistroIcon(imageName: string): string {
    if (!imageName) return distroIconMap.default;

    const lowerCaseName = imageName.toLowerCase();

    for (const distro in distroIconMap) {
        if (lowerCaseName.includes(distro)) {
            return distroIconMap[distro];
        }
    }

    return distroIconMap.default;
}
