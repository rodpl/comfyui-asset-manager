#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Create or replace symbolic link
# The link will be created in the ComfyUI custom_nodes directory, pointing to this project directory.
LINK_TARGET_DIR="$HOME/Code/Rod/AI/StabilityMatrix/Packages/ComfyUI/custom_nodes"
LINK_NAME="$LINK_TARGET_DIR/comfyui-asset-manager"
PROJECT_DIR="$(pwd)"

# Ensure the target directory exists
mkdir -p "$LINK_TARGET_DIR"

echo "Creating symlink: $LINK_NAME -> $PROJECT_DIR"
# Remove existing link if it exists, then create new one
if [ -L "$LINK_NAME" ] || [ -e "$LINK_NAME" ]; then
    echo "Removing existing link/file: $LINK_NAME"
    rm -f "$LINK_NAME"
fi
# -s for symbolic
ln -s "$PROJECT_DIR" "$LINK_NAME"

# Change to the UI directory and run the watch script
echo "Changing to ui directory and running 'pnpm run watch'"
cd ui
pnpm run watch
