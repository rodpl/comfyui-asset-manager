#!/bin/bash
set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# Validate configuration
validate_config

# Create working directory
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "Step 1: Cloning the original repository..."
git clone "$MAIN_REPO_PATH" original-repo
cd original-repo

echo "Step 2: Extracting .kiro folder with its history..."
# Install git-filter-repo if not already installed
if ! command -v git-filter-repo &> /dev/null; then
    echo "Installing git-filter-repo..."
    brew install git-filter-repo
fi

# Create a new branch for extraction
git checkout -b kiro-extraction

# Extract .kiro folder with its history and move contents to root
git filter-repo --path .kiro/ --path-rename .kiro/:./

echo "Step 3: Creating new private repository for .kiro content..."
cd "$WORK_DIR"
mkdir -p "$KIRO_REPO_NAME"
cd "$KIRO_REPO_NAME"
git init

# Pull in the filtered history
git remote add origin-filtered "$WORK_DIR/original-repo"
git pull origin-filtered kiro-extraction

echo "Step 4: Setting up remote repository..."
# Create GitHub repository (you'll need to do this manually or via GitHub CLI)
echo "Please create a private repository on GitHub named: $KIRO_REPO_NAME"
echo "Then run: git remote add origin https://github.com/$GITHUB_USERNAME/$KIRO_REPO_NAME.git"
echo "And: git push -u origin main"

echo "Step 5: Going back to main repository to set up submodule..."
cd "$MAIN_REPO_PATH"

# Remove .kiro folder from main repo
git rm -rf .kiro/
git commit -m "Remove .kiro folder - moved to separate private repository"

# Add .kiro to gitignore to prevent accidental commits
echo "" >> .gitignore
echo "# Private kiro repository (use as submodule)" >> .gitignore
echo ".kiro/" >> .gitignore

git add .gitignore
git commit -m "Add .kiro to gitignore"

echo "Step 6: Instructions for adding as submodule..."
echo ""
echo "After you've pushed the kiro repository to GitHub, run:"
echo "git submodule add https://github.com/$GITHUB_USERNAME/$KIRO_REPO_NAME.git .kiro"
echo "git commit -m 'Add kiro as private submodule'"
echo ""
echo "Extraction complete!"
echo "Main repo location: $MAIN_REPO_PATH"
echo "Kiro repo location: $WORK_DIR/$KIRO_REPO_NAME"
