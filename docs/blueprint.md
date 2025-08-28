# **App Name**: DistroWolf

## Core Features:

- System Installation & Info: Detect if Distrobox and its dependencies are installed. If not, guide the user through an automated installation wizard with robust error handling and dependency resolution.
- List Containers: List all available Distrobox containers with their status (running/stopped) and size.
- Container Actions: Provide actions for each container: start, stop, enter, info, delete, enable/disable autostart on boot, save as image.
- Find Applications to Share: Tool to identify the container's package manager and allow the user to search for installed packages and export them to the host. Allow users to select package managers to consider, and search using a text query.
- List Shared Applications: Show a list of currently shared apps/binaries and provide an option to unshare them. Enumerate all the exported software using standard Distrobox commands
- Create New Container: Allow the user to create a new container by choosing a base image (from local images), entering a name, and setting options like shared/isolated home, init flag, Nvidia GPU compatibility, and mount volumes.
- Manage Local Images: List all available local images with details (size, creation time, tag, repository) and options to export/import images as .tar files.
- Download Container Images: Download container images from a list of official registries or a custom URL, adding them to local images for later use.

## Style Guidelines:

- Primary color: Light green (#90EE90) for a modern, accessible feel.
- Background color: Dark gray (#36454F) for a sleek, distraction-free workspace.
- Accent color: Pale Turquoise (#AFEEEE) for highlighting important UI elements without disrupting the overall theme.
- Font pairing: 'Inter' (sans-serif) for body text, and 'Space Grotesk' (sans-serif) for headings.
- Use minimalist icons for container status, actions, and navigation, ensuring clarity and avoiding clutter.
- Employ a responsive design with a top container list panel, app share panel, and system info section. Implement an expandable panel or a dedicated management panel for selected containers.
- Subtle animations when switching panels, starting or stopping containers, and importing or exporting images. Focus on transitions and feedback, not unnecessary eye candy.