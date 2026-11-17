#!/bin/bash

# Kiro Repository Management Configuration
# Edit these values according to your setup

# Repository Configuration
MAIN_REPO_PATH="/Users/rod/Code/Rod/AI/git-split/comfyui-asset-manager"
WORK_DIR="/Users/rod/kiro-extraction-workspace"
KIRO_REPO_NAME="comfyui-asset-manager-kiro"
MAIN_REPO_NAME="comfyui-asset-manager"

# GitHub Configuration
# Replace with your actual GitHub username
GITHUB_USERNAME="rodpl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Validation function
validate_config() {
    if [ "$GITHUB_USERNAME" = "your-username" ]; then
        print_error "Please update GITHUB_USERNAME in config.sh"
        exit 1
    fi
    
    if [ ! -d "$MAIN_REPO_PATH" ]; then
        print_error "Main repository path does not exist: $MAIN_REPO_PATH"
        exit 1
    fi
}