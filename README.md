
# 🐺 DistroWolf - A GUI for Distrobox

![DistroWolf Logo](https://raw.githubusercontent.com/noyzey/distrowolf/main/public/dw.png)

Welcome to **DistroWolf**, your friendly and powerful graphical interface for managing [Distrobox](https://distrobox.it/) containers! If you love the flexibility of Distrobox but crave a visual way to manage your environments, DistroWolf is here to help.

Built with modern web technologies, DistroWolf provides a sleek, intuitive desktop experience for creating, managing, and interacting with your containers and images.

---

## ✨ Features

DistroWolf packs a punch with a host of features designed to streamline your workflow:

- **📦 Container Management**:
  - **View all** your Distrobox containers in a clean, organized list.
  - **Start, Stop, and Delete** containers with a single click.
  - **Enter a Container**: Quickly open a terminal session inside your container.
  - **View Container Info**: Get detailed information about any container.
  - **Save as Image**: Create a new image from an existing container's state.

- **🖼️ Image Management**:
  - **List local** Podman/Docker images.
  - **Download Images**: Pull new images from popular registries with a curated list of suggestions.
  - **Delete Images**: Free up space by removing unused images.
  - **Import & Export**: Save your images as `.tar` archives and load them back in, perfect for backups and sharing.

- **🚀 Application Integration**:
  - **Find & Export Apps**: Search for installed packages within a container and export their launchers to your host system.
  - **Manage Shared Apps**: View and unshare applications that have been exported from a container.

- **🖥️ Modern UI & UX**:
  - A clean, responsive interface built with **Next.js**, **React**, and **Tailwind CSS**.
  - **Distro Logos**: Beautiful, colorful logos for easy identification of your base images.
  - **Global Search**: Quickly filter through your containers and images.
  - **System Info**: See your host OS, Distrobox, and Podman versions at a glance.

---

## ⚙️ Getting Started

### Prerequisites

Before you run DistroWolf, you need to have the core dependencies installed on your system:

1.  **[Distrobox](https://distrobox.it/usage/installation/)**: The star of the show.
2.  **[Podman](https://podman.io/docs/installation)** or **[Docker](https://docs.docker.com/engine/install/)**: A container runtime for Distrobox to use.

### Installation & Running

To get DistroWolf running on your local machine, follow these simple steps:

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
    This will start the Next.js development server and the Electron app.
    ```bash
    npm run electron:dev
    ```

### Building the Application

To create a distributable package (like an AppImage for Linux), run the build command:

```bash
npm run electron:build
```

The final application will be located in the `dist` directory.

---

##  kullanım

Using DistroWolf is designed to be straightforward:

- **Navigate** using the clean sidebar menu to switch between managing containers, images, and system info.
- **Create a New Container** by selecting a base image, giving it a name, and configuring options like shared home directories or Nvidia GPU access.
- **Download an Image** from the curated list or by providing a custom image URL.
- **Click on a container** in the main list to open the application management panels below it.

Enjoy taming your distros with DistroWolf!
