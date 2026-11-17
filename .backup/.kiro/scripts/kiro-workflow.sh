#!/bin/bash
set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# Validate configuration
validate_config

# Ensure we're in the main repository
cd "$MAIN_REPO_PATH"

# Check if .kiro exists as submodule
check_kiro_setup() {
    if [ -f .gitmodules ] && grep -q ".kiro" .gitmodules; then
        return 0
    else
        return 1
    fi
}

# Initialize kiro submodule if not present
init_kiro() {
    print_header "Initializing Kiro Submodule"
    
    if check_kiro_setup; then
        print_success "Kiro submodule already configured"
        git submodule update --init --recursive .kiro
    else
        print_warning "Kiro submodule not found. Please run the extraction script first."
        exit 1
    fi
}

# Sync changes from main repo to kiro
sync_to_kiro() {
    print_header "Syncing Changes to Kiro Repository"
    
    # Ensure kiro submodule is initialized
    if [ ! -d ".kiro/.git" ]; then
        init_kiro
    fi
    
    cd .kiro
    
    # Check if there are any changes
    if git diff --quiet && git diff --cached --quiet; then
        print_success "No changes to sync in kiro repository"
    else
        print_warning "Found changes in kiro repository"
        git status
        
        read -p "Do you want to commit and push these changes? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter commit message: " commit_msg
            git add .
            git commit -m "$commit_msg"
            git push origin main
            print_success "Changes pushed to kiro repository"
        fi
    fi
    
    cd ..
}

# Sync changes from kiro to main repo
sync_from_kiro() {
    print_header "Syncing Changes from Kiro Repository"
    
    # Ensure kiro submodule is initialized
    if [ ! -d ".kiro/.git" ]; then
        init_kiro
    fi
    
    cd .kiro
    git pull origin main
    cd ..
    
    # Check if submodule reference changed
    if git diff --quiet .kiro; then
        print_success "Kiro submodule is up to date"
    else
        print_warning "Kiro submodule has updates"
        git add .kiro
        git commit -m "Update kiro submodule reference"
        print_success "Updated kiro submodule reference in main repository"
    fi
}

# Full sync (both directions)
full_sync() {
    print_header "Performing Full Sync"
    sync_from_kiro
    sync_to_kiro
    
    # Check main repo status
    if git diff --quiet && git diff --cached --quiet; then
        print_success "Main repository is clean"
    else
        print_warning "Main repository has uncommitted changes"
        git status
    fi
}

# Setup for new contributors (public repo users)
setup_public() {
    print_header "Setting up for Public Repository Usage"
    
    # Create empty .kiro directory structure for public users
    if [ ! -d ".kiro" ]; then
        mkdir -p .kiro/{scripts,settings,specs,steering}
        
        # Create placeholder files
        cat > .kiro/README.md << 'EOF'
# Kiro Directory

This directory contains private development resources and is not included in the public repository.

If you're a contributor with access to the private kiro repository, please run:
```bash
git submodule update --init --recursive .kiro
```

For public contributors, this directory can be ignored.
EOF
        
        # Create empty placeholder files
        touch .kiro/scripts/.gitkeep
        touch .kiro/settings/.gitkeep
        touch .kiro/specs/.gitkeep
        touch .kiro/steering/.gitkeep
        
        print_success "Created placeholder .kiro structure for public repository"
    else
        print_success ".kiro directory already exists"
    fi
}

# Status check
status() {
    print_header "Repository Status"
    
    echo "Main repository:"
    git status --short
    
    if check_kiro_setup && [ -d ".kiro/.git" ]; then
        echo ""
        echo "Kiro submodule:"
        cd .kiro
        git status --short
        cd ..
    else
        print_warning "Kiro submodule not initialized or not configured"
    fi
}

# Show help
show_help() {
    echo "Kiro Workflow Management Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  init          Initialize kiro submodule"
    echo "  sync-to       Sync changes TO kiro repository"
    echo "  sync-from     Sync changes FROM kiro repository"
    echo "  sync          Full sync (both directions)"
    echo "  setup-public  Setup placeholder structure for public repo"
    echo "  status        Show status of both repositories"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 sync       # Sync all changes"
    echo "  $0 status     # Check status"
    echo "  $0 init       # Initialize submodule"
}

# Main script logic
case "${1:-help}" in
    "init")
        init_kiro
        ;;
    "sync-to")
        sync_to_kiro
        ;;
    "sync-from")
        sync_from_kiro
        ;;
    "sync")
        full_sync
        ;;
    "setup-public")
        setup_public
        ;;
    "status")
        status
        ;;
    "help"|*)
        show_help
        ;;
esac