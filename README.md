# ComfyUI Asset Manager

A powerful ComfyUI extension that brings comprehensive asset management directly into your ComfyUI interface. Inspired by Stability Matrix, this extension simplifies how you organize, discover, and manage your AI models and outputs.

## What It Does

ComfyUI Asset Manager transforms the way you handle assets in ComfyUI by providing a centralized, user-friendly interface for all your asset management needs. No more switching between file explorers, web browsers, and ComfyUI - everything you need is right at your fingertips.

## Key Features

### Local Asset Management
- **Organize Your Collection**: Browse and manage all your locally stored models, checkpoints, LoRAs, and other assets in one place
- **Smart Organization**: Sort, filter, and categorize your assets for quick access
- **Asset Information**: View detailed information about each asset including file size, type, and metadata

### Model Browser & Discovery
- **Direct Platform Integration**: Browse and download models directly from popular platforms like CivitAI and HuggingFace
- **One-Click Downloads**: Install new models without leaving ComfyUI
- **Preview & Information**: See model previews, descriptions, and ratings before downloading
- **Smart Installation**: Automatically places downloaded models in the correct ComfyUI directories

### Output Gallery
- **Visual Gallery**: View all your ComfyUI-generated images and outputs in an organized gallery
- **Smart Sorting**: Sort outputs by date, workflow, or custom tags
- **Batch Operations**: Manage multiple outputs at once - delete, move, or organize with ease
- **Workflow Tracking**: See which workflow generated each output

## Why Use ComfyUI Asset Manager?

### Before
- Manually downloading models from websites
- Navigating complex folder structures
- Losing track of where assets are stored
- Switching between multiple applications
- Difficulty organizing generated outputs

### After
- Everything managed from within ComfyUI
- One-click model downloads and installation
- Organized, searchable asset library
- Streamlined workflow
- Beautiful output gallery with smart organization

## Perfect For

- **AI Artists** who want to focus on creating rather than managing files
- **Workflow Enthusiasts** who use multiple models and need organization
- **Content Creators** who generate lots of outputs and need easy management
- **Teams** who share and collaborate on AI projects
- **Anyone** who wants a cleaner, more efficient ComfyUI experience

## Experience

The extension integrates seamlessly into ComfyUI's sidebar, providing a native feel that doesn't disrupt your existing workflow. The intuitive tabbed interface makes it easy to switch between managing local assets, discovering new models, and organizing your outputs.

Think of it as bringing the best parts of Stability Matrix directly into ComfyUI - but as a lightweight, integrated extension rather than a separate application.

## Installation

### Option 1: ComfyUI Manager (Recommended)
1. Install [ComfyUI Manager](https://github.com/ltdrdata/ComfyUI-Manager) if you haven't already
2. Open ComfyUI Manager in your ComfyUI interface
3. Search for "ComfyUI Asset Manager"
4. Click "Install" and restart ComfyUI

### Option 2: Manual Installation
1. Clone or download this repository
2. Place the entire folder in your ComfyUI `custom_nodes` directory
3. Follow the setup instructions below
4. Restart ComfyUI

## Setup

### Prerequisites
- **Python 3.8+** (usually comes with ComfyUI)
- **Node.js 18+** and **pnpm** (for frontend development)
- **Poetry** (for Python dependency management)

### Quick Setup
Run the provided setup script:
```bash
# Make the script executable (Linux/Mac)
chmod +x setup.sh

# Run setup
./setup.sh
```

### Manual Setup

#### 1. Python Backend Setup
```bash
# Install Poetry if you don't have it
pip install poetry

# Install Python dependencies
poetry install --no-root
```

#### 2. Frontend Setup
```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Navigate to frontend directory and install dependencies
cd ui
pnpm install

# Build the frontend for production
pnpm run build

# Return to root directory
cd ..
```

### Development Setup

If you plan to contribute or modify the extension:

```bash
# Frontend development with hot reload
cd ui
pnpm run dev

# Or watch mode for automatic rebuilding
pnpm run watch

# Run tests
pnpm run test

# Lint and format code
pnpm run lint
pnpm run format
```

### Verification

After setup, restart ComfyUI and you should see:
1. A new "Asset Manager" tab in your ComfyUI sidebar (with a server icon)
2. No error messages in the ComfyUI console
3. The extension should load with three tabs: Local Assets, Model Browser, and Outputs

### Troubleshooting

**Extension not appearing:**
- Ensure the folder is in the correct `custom_nodes` directory
- Check ComfyUI console for error messages
- Verify all dependencies are installed correctly

**Build errors:**
- Make sure you have Node.js 18+ and pnpm installed
- Try deleting `ui/node_modules` and running `pnpm install` again
- Check that the `dist/` directory was created after building

**Python errors:**
- Ensure Poetry is installed and working
- Try running `poetry install --no-root` again
- Check that your Python version is 3.8 or higher

## Getting Started

Once installed, you'll see a new "Asset Manager" tab in your ComfyUI sidebar with three main sections:

1. **Local Assets** - Start here to see and organize your existing models
2. **Model Browser** - Discover and download new models from CivitAI and HuggingFace
3. **Outputs** - View and manage your generated images and outputs

## Contributing

We welcome contributions! Whether it's bug reports, feature requests, or code contributions, please feel free to get involved.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the excellent asset management features of [Stability Matrix](https://github.com/LykosAI/StabilityMatrix)
- Built for the amazing [ComfyUI](https://github.com/comfyanonymous/ComfyUI) community

---

*Transform your ComfyUI workflow today with better asset management!*