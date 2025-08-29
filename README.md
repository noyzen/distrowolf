
# 🐺 DistroWolf: The Ultimate GUI for Distrobox

**Tame your Linux containers with a sleek, powerful, and intuitive graphical interface.**

![A placeholder image of the DistroWolf application interface, showing a modern dark theme with a list of containers.](https://picsum.photos/800/450)
*<p align="center">A clean, modern interface for all your container needs.</p>*

---

## ✨ Why DistroWolf?

[Distrobox](https://distrobox.it/) is an incredible tool that brings unprecedented flexibility to the Linux desktop. However, managing numerous containers and applications via the command line can become cumbersome. DistroWolf bridges that gap by providing a beautiful and feature-rich desktop application to manage your entire Distrobox ecosystem.

Whether you're a developer managing multiple environments, a gamer isolating your library, or a power user exploring the Linux landscape, DistroWolf makes container management effortless.

## 🚀 Core Features

DistroWolf is packed with features to streamline your container workflow:

- **📦 Full Container Management**:
  - **View, Create, Start, Stop, and Delete** containers with a few clicks.
  - **Enter a Container**: Instantly launch a terminal session inside any container.
  - **Detailed Info**: Inspect container configurations, mounts, and flags.
  - **Save as Image**: Snapshot a container's state into a new reusable image.
  - **Toggle Autostart**: Easily configure containers to start on boot.

- **🖼️ Image Hub**:
  - **List & Manage** all local Podman/Docker images.
  - **Download Images**: Pull new images from a curated list of popular and stable distributions, or add your own custom URL.
  - **Import & Export**: Backup and share your images as `.tar` archives.

- **🖥️ Seamless Application Integration**:
  - **Find & Share Apps**: Search for installed packages within a container and export their launchers to your host system's application menu.
  - **Manage Shared Apps**: View all exported apps and unshare them just as easily.

- ** Modern UI & UX**:
  - A clean, responsive interface built with **Next.js**, **React**, and **Tailwind CSS**.
  - **Global Search**: Instantly filter through your containers and images.
  - **System Dashboard**: See your host OS, Distrobox, and Podman versions at a glance.
  - **Animated & Responsive**: Smooth transitions and a responsive design that feels great to use.

---

## ⚙️ Getting Started

### Prerequisites

Before you can run DistroWolf, you need the core dependencies installed on your system:

1.  **[Distrobox](https://distrobox.it/usage/installation/)**: The underlying container management tool.
2.  **[Podman](https://podman.io/docs/installation)** or **[Docker](https://docs.docker.com/engine/install/)**: The container runtime engine.

### Installation & Running

Getting DistroWolf up and running is simple:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/noyzey/distrowolf.git
    cd distrowolf
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run in development mode**:
    This command starts both the Next.js development server and the Electron application.
    ```bash
    npm run electron:dev
    ```

### Building for Production

To create a distributable package for your system (e.g., an AppImage for Linux), run the build command:

```bash
npm run electron:build
```

The final application will be located in the `dist` directory.

---

## 🛠️ Usage

Using DistroWolf is designed to be intuitive:

- **Navigate** using the sidebar menu to switch between managing containers, images, and system info.
- **Create a container** from the "Create New" page by selecting a base image and configuring options.
- **Click on a container** in the main list to open the application management panels below it.
- **Search** for anything from the header bar to quickly find containers or images.

Enjoy a more powerful and elegant way to manage your distros with DistroWolf!
