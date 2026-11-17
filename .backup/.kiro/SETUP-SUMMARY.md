# Kiro Repository Separation - Quick Start

## 🚀 Quick Setup (Recommended)

1. **Configure your GitHub username:**
   ```bash
   # Edit the configuration file
   nano .kiro/scripts/config.sh
   # Change GITHUB_USERNAME="your-username" to your actual GitHub username
   ```

2. **Run the master setup script:**
   ```bash
   ./.kiro/scripts/setup-master.sh
   ```

That's it! The script will guide you through the entire process.

## 📋 What This Does

- **Extracts** `.kiro` folder with complete git history into a separate repository
- **Creates** two GitHub repositories:
  - `comfyui-asset-manager` (public) - main code without .kiro
  - `comfyui-asset-manager-kiro` (private) - only .kiro content
- **Sets up** the private repo as a git submodule in the main repo
- **Configures** daily workflow scripts for easy management

## 🔄 Daily Workflow

After setup, use these commands for daily operations:

```bash
# Check status of both repositories
./.kiro/scripts/kiro-workflow.sh status

# Sync all changes (both directions)
./.kiro/scripts/kiro-workflow.sh sync

# Sync changes TO kiro repository
./.kiro/scripts/kiro-workflow.sh sync-to

# Sync changes FROM kiro repository  
./.kiro/scripts/kiro-workflow.sh sync-from
```

## 👥 For Contributors

### Public Contributors (no kiro access)
```bash
git clone https://github.com/username/comfyui-asset-manager.git
# Works normally, .kiro folder is ignored
```

### Private Contributors (with kiro access)
```bash
git clone --recurse-submodules https://github.com/username/comfyui-asset-manager.git
# Gets both main repo and private .kiro submodule
```

## 🛠 Manual Setup (Advanced)

If you prefer to run steps individually:

1. **Extract kiro:**
   ```bash
   ./.kiro/scripts/extract-kiro.sh
   ```

2. **Setup GitHub repos:**
   ```bash
   ./.kiro/scripts/setup-github-repos.sh setup
   ```

3. **Push main repo:**
   ```bash
   git push -u origin main
   ```

## 📁 Repository Structure After Setup

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

## 🔧 Available Scripts

- `setup-master.sh` - Complete guided setup
- `extract-kiro.sh` - Extract .kiro with history
- `setup-github-repos.sh` - Create and configure GitHub repos
- `kiro-workflow.sh` - Daily workflow management
- `config.sh` - Shared configuration

## 📖 Full Documentation

See `.kiro/scripts/README.md` for complete documentation and troubleshooting.

## ⚠️ Important Notes

- The setup creates a backup of your current repository
- `.kiro` folder is added to `.gitignore` in the main repo
- All git history is preserved in both repositories
- Public contributors cannot access the private kiro repository
- The setup is reversible (you can restore from backup if needed)