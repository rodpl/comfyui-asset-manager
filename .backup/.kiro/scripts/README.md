# Kiro Repository Management Scripts

This directory contains scripts to manage the separation of the `.kiro` folder into a private repository while keeping the main repository public.

## Overview

The setup creates two repositories:
- **Main Repository (Public)**: Contains all the public code without the `.kiro` folder
- **Kiro Repository (Private)**: Contains only the `.kiro` folder content with full git history

The private repository is linked to the main repository as a git submodule.

## Scripts

### 1. `extract-kiro.sh` - Initial Extraction
Extracts the `.kiro` folder with its complete git history into a separate repository.

**Usage:**
```bash
./extract-kiro.sh
```

**What it does:**
- Clones the current repository
- Uses `git-filter-repo` to extract `.kiro` folder with history
- Moves `.kiro` contents to the root of the new repository
- Removes `.kiro` from the main repository
- Updates `.gitignore` to exclude `.kiro`

### 2. `setup-github-repos.sh` - GitHub Setup
Creates GitHub repositories and sets up the connection between them.

**Prerequisites:**
- GitHub CLI installed: `brew install gh`
- Authenticated with GitHub: `gh auth login`
- Kiro extraction completed

**Usage:**
```bash
./setup-github-repos.sh setup
```

**Commands:**
- `setup` - Complete setup (recommended)
- `create-repos` - Create GitHub repositories only
- `setup-main` - Setup main repository remote only
- `push-kiro` - Push kiro repository only
- `setup-sub` - Setup submodule only

### 3. `kiro-workflow.sh` - Daily Workflow
Manages daily operations with both repositories.

**Usage:**
```bash
./kiro-workflow.sh [command]
```

**Commands:**
- `sync` - Full sync (both directions)
- `sync-to` - Sync changes TO kiro repository
- `sync-from` - Sync changes FROM kiro repository
- `init` - Initialize kiro submodule
- `status` - Show status of both repositories
- `setup-public` - Setup placeholder structure for public repo

## Complete Setup Process

### Step 1: Initial Extraction
```bash
# Make scripts executable
chmod +x .kiro/scripts/*.sh

# Extract kiro folder with history
./.kiro/scripts/extract-kiro.sh
```

### Step 2: GitHub Setup
```bash
# Install and authenticate GitHub CLI if not done
brew install gh
gh auth login

# Create repositories and set up connections
./.kiro/scripts/setup-github-repos.sh setup
```

### Step 3: Push Main Repository
```bash
# Push the main repository to GitHub
git push -u origin main
```

## Daily Workflow

### For Private Contributors (with kiro access)
```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/username/comfyui-asset-manager.git

# Daily sync
./.kiro/scripts/kiro-workflow.sh sync

# Check status
./.kiro/scripts/kiro-workflow.sh status
```

### For Public Contributors
```bash
# Clone main repository only
git clone https://github.com/username/comfyui-asset-manager.git

# The .kiro folder will be ignored and won't cause issues
```

## Repository Structure

### Main Repository (Public)
```
comfyui-asset-manager/
├── src/
├── ui/
├── docs/
├── tests/
├── .gitignore          # Contains .kiro/ exclusion
├── .gitmodules         # Submodule configuration
└── .kiro/              # Git submodule (private repo)
```

### Kiro Repository (Private)
```
comfyui-asset-manager-kiro/
├── scripts/
├── settings/
├── specs/
└── steering/
```

## Troubleshooting

### Submodule Issues
```bash
# Initialize submodule if missing
git submodule update --init --recursive .kiro

# Update submodule to latest
cd .kiro
git pull origin main
cd ..
git add .kiro
git commit -m "Update kiro submodule"
```

### Sync Issues
```bash
# Check status of both repos
./.kiro/scripts/kiro-workflow.sh status

# Force sync from kiro
./.kiro/scripts/kiro-workflow.sh sync-from
```

### Access Issues
- Ensure you have access to the private kiro repository
- Check GitHub authentication: `gh auth status`
- Verify submodule URL in `.gitmodules`

## Security Notes

- The `.kiro` folder is added to `.gitignore` to prevent accidental commits to the main repo
- Public contributors cannot access the private kiro repository
- All kiro content remains private and separate from the public repository
- Git history is preserved in both repositories

## Configuration

Edit the configuration variables at the top of each script:
- `GITHUB_USERNAME` - Your GitHub username
- `MAIN_REPO_PATH` - Path to your main repository
- `KIRO_REPO_NAME` - Name for the private kiro repository