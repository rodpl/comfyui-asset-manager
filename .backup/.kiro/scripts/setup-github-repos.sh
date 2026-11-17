#!/bin/bash
set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# Validate configuration
validate_config

# Check if GitHub CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed"
        echo "Please install it with: brew install gh"
        echo "Then authenticate with: gh auth login"
        exit 1
    fi
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI is not authenticated"
        echo "Please run: gh auth login"
        exit 1
    fi
    
    print_success "GitHub CLI is installed and authenticated"
}

# Create GitHub repositories
create_github_repos() {
    print_header "Creating GitHub Repositories"
    
    # Get GitHub username
    GITHUB_USERNAME=$(gh api user --jq '.login')
    print_success "GitHub username: $GITHUB_USERNAME"
    
    # Create public main repository
    print_header "Creating Public Main Repository"
    if gh repo view "$GITHUB_USERNAME/$MAIN_REPO_NAME" &> /dev/null; then
        print_warning "Repository $MAIN_REPO_NAME already exists"
    else
        gh repo create "$MAIN_REPO_NAME" --public --description "ComfyUI Asset Manager - Public Repository"
        print_success "Created public repository: $MAIN_REPO_NAME"
    fi
    
    # Create private kiro repository
    print_header "Creating Private Kiro Repository"
    if gh repo view "$GITHUB_USERNAME/$KIRO_REPO_NAME" &> /dev/null; then
        print_warning "Repository $KIRO_REPO_NAME already exists"
    else
        gh repo create "$KIRO_REPO_NAME" --private --description "ComfyUI Asset Manager - Private Kiro Resources"
        print_success "Created private repository: $KIRO_REPO_NAME"
    fi
    
    echo ""
    print_success "GitHub repositories created successfully!"
    echo "Public repo: https://github.com/$GITHUB_USERNAME/$MAIN_REPO_NAME"
    echo "Private repo: https://github.com/$GITHUB_USERNAME/$KIRO_REPO_NAME"
}

# Setup main repository
setup_main_repo() {
    print_header "Setting up Main Repository"
    
    cd "$MAIN_REPO_PATH"
    
    # Get GitHub username
    GITHUB_USERNAME=$(gh api user --jq '.login')
    
    # Add remote if not exists
    if git remote get-url origin &> /dev/null; then
        print_warning "Origin remote already exists"
        git remote set-url origin "https://github.com/$GITHUB_USERNAME/$MAIN_REPO_NAME.git"
    else
        git remote add origin "https://github.com/$GITHUB_USERNAME/$MAIN_REPO_NAME.git"
    fi
    
    print_success "Main repository remote configured"
}

# Push kiro repository
push_kiro_repo() {
    print_header "Pushing Kiro Repository"
    
    if [ ! -d "$WORK_DIR/$KIRO_REPO_NAME" ]; then
        print_error "Kiro repository not found at $WORK_DIR/$KIRO_REPO_NAME"
        echo "Please run the extraction script first: ./extract-kiro.sh"
        exit 1
    fi
    
    cd "$WORK_DIR/$KIRO_REPO_NAME"
    
    # Get GitHub username
    GITHUB_USERNAME=$(gh api user --jq '.login')
    
    # Add remote and push
    if git remote get-url origin &> /dev/null; then
        git remote set-url origin "https://github.com/$GITHUB_USERNAME/$KIRO_REPO_NAME.git"
    else
        git remote add origin "https://github.com/$GITHUB_USERNAME/$KIRO_REPO_NAME.git"
    fi
    
    git push -u origin main
    print_success "Kiro repository pushed to GitHub"
}

# Setup submodule in main repo
setup_submodule() {
    print_header "Setting up Kiro Submodule"
    
    cd "$MAIN_REPO_PATH"
    
    # Get GitHub username
    GITHUB_USERNAME=$(gh api user --jq '.login')
    
    # Add submodule
    if [ -f .gitmodules ] && grep -q ".kiro" .gitmodules; then
        print_warning "Kiro submodule already configured"
    else
        git submodule add "https://github.com/$GITHUB_USERNAME/$KIRO_REPO_NAME.git" .kiro
        git commit -m "Add kiro as private submodule"
        print_success "Kiro submodule added to main repository"
    fi
}

# Complete setup
complete_setup() {
    print_header "Complete Repository Setup"
    
    check_gh_cli
    create_github_repos
    setup_main_repo
    
    # Check if extraction was done
    if [ -d "$WORK_DIR/$KIRO_REPO_NAME" ]; then
        push_kiro_repo
        setup_submodule
        
        print_header "Setup Complete!"
        print_success "Both repositories are now set up and connected"
        echo ""
        echo "Next steps:"
        echo "1. Push your main repository: git push -u origin main"
        echo "2. Use the workflow script for daily operations: ./kiro-workflow.sh"
        echo ""
        echo "For public contributors, they can clone just the main repo:"
        echo "git clone https://github.com/$(gh api user --jq '.login')/$MAIN_REPO_NAME.git"
        echo ""
        echo "For private contributors with kiro access:"
        echo "git clone --recurse-submodules https://github.com/$(gh api user --jq '.login')/$MAIN_REPO_NAME.git"
    else
        print_warning "Kiro extraction not found. Please run ./extract-kiro.sh first"
    fi
}

# Show help
show_help() {
    echo "GitHub Repository Setup Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup         Complete setup (creates repos, pushes code, sets up submodule)"
    echo "  create-repos  Create GitHub repositories only"
    echo "  setup-main    Setup main repository remote only"
    echo "  push-kiro     Push kiro repository only"
    echo "  setup-sub     Setup submodule only"
    echo "  help          Show this help message"
    echo ""
    echo "Prerequisites:"
    echo "  - GitHub CLI installed and authenticated (gh auth login)"
    echo "  - Kiro extraction completed (run ./extract-kiro.sh first)"
}

# Main script logic
case "${1:-help}" in
    "setup")
        complete_setup
        ;;
    "create-repos")
        check_gh_cli
        create_github_repos
        ;;
    "setup-main")
        check_gh_cli
        setup_main_repo
        ;;
    "push-kiro")
        check_gh_cli
        push_kiro_repo
        ;;
    "setup-sub")
        check_gh_cli
        setup_submodule
        ;;
    "help"|*)
        show_help
        ;;
esac