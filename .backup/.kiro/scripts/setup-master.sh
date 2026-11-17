#!/bin/bash
set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"

# Master setup script for kiro repository separation
print_header "Kiro Repository Separation - Master Setup"

echo "This script will guide you through the complete process of separating"
echo "the .kiro folder into a private repository while keeping the main"
echo "repository public."
echo ""

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local all_good=true
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository"
        all_good=false
    else
        print_success "Git repository detected"
    fi
    
    # Check if .kiro folder exists
    if [ ! -d ".kiro" ]; then
        print_error ".kiro folder not found"
        all_good=false
    else
        print_success ".kiro folder found"
    fi
    
    # Check if git-filter-repo is available
    if ! command -v git-filter-repo &> /dev/null; then
        print_warning "git-filter-repo not found - will be installed automatically"
    else
        print_success "git-filter-repo is available"
    fi
    
    # Check if GitHub CLI is available
    if ! command -v gh &> /dev/null; then
        print_warning "GitHub CLI not found - please install with: brew install gh"
        all_good=false
    else
        print_success "GitHub CLI is available"
        
        # Check if authenticated
        if ! gh auth status &> /dev/null; then
            print_warning "GitHub CLI not authenticated - please run: gh auth login"
            all_good=false
        else
            print_success "GitHub CLI is authenticated"
        fi
    fi
    
    if [ "$all_good" = false ]; then
        print_error "Prerequisites not met. Please fix the issues above and try again."
        exit 1
    fi
    
    print_success "All prerequisites met!"
}

# Configuration check
check_configuration() {
    print_header "Configuration Check"
    
    echo "Current configuration:"
    echo "  Main repo path: $MAIN_REPO_PATH"
    echo "  Work directory: $WORK_DIR"
    echo "  Kiro repo name: $KIRO_REPO_NAME"
    echo "  Main repo name: $MAIN_REPO_NAME"
    echo "  GitHub username: $GITHUB_USERNAME"
    echo ""
    
    if [ "$GITHUB_USERNAME" = "your-username" ]; then
        print_error "Please update the GITHUB_USERNAME in config.sh"
        echo "Edit: $SCRIPT_DIR/config.sh"
        exit 1
    fi
    
    read -p "Is this configuration correct? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Please update the configuration in: $SCRIPT_DIR/config.sh"
        exit 1
    fi
    
    print_success "Configuration confirmed"
}

# Show process overview
show_process() {
    print_header "Process Overview"
    
    echo "The setup will perform these steps:"
    echo ""
    echo "1. Extract .kiro folder with git history"
    echo "2. Create GitHub repositories (public main, private kiro)"
    echo "3. Push kiro repository to GitHub"
    echo "4. Set up kiro as submodule in main repository"
    echo "5. Configure daily workflow scripts"
    echo ""
    echo "After completion:"
    echo "- Public users can clone the main repo without .kiro"
    echo "- Private users can clone with --recurse-submodules to get .kiro"
    echo "- You can use the workflow script for daily operations"
    echo ""
    
    read -p "Do you want to proceed? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Setup cancelled"
        exit 0
    fi
}

# Backup current state
backup_current_state() {
    print_header "Creating Backup"
    
    local backup_dir="$HOME/kiro-setup-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Create a backup of the current repository
    cp -r "$MAIN_REPO_PATH" "$backup_dir/"
    
    print_success "Backup created at: $backup_dir"
    echo "You can restore from this backup if needed"
}

# Run the complete setup
run_setup() {
    print_header "Running Complete Setup"
    
    # Step 1: Extract kiro
    print_header "Step 1: Extracting Kiro Repository"
    "$SCRIPT_DIR/extract-kiro.sh"
    
    # Step 2: Setup GitHub repositories
    print_header "Step 2: Setting up GitHub Repositories"
    "$SCRIPT_DIR/setup-github-repos.sh" setup
    
    # Step 3: Final instructions
    print_header "Setup Complete!"
    
    echo ""
    print_success "Kiro repository separation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Push your main repository:"
    echo "   git push -u origin main"
    echo ""
    echo "2. For daily operations, use:"
    echo "   $SCRIPT_DIR/kiro-workflow.sh sync"
    echo ""
    echo "3. For public contributors:"
    echo "   git clone https://github.com/$GITHUB_USERNAME/$MAIN_REPO_NAME.git"
    echo ""
    echo "4. For private contributors with kiro access:"
    echo "   git clone --recurse-submodules https://github.com/$GITHUB_USERNAME/$MAIN_REPO_NAME.git"
    echo ""
    echo "Repository URLs:"
    echo "  Public:  https://github.com/$GITHUB_USERNAME/$MAIN_REPO_NAME"
    echo "  Private: https://github.com/$GITHUB_USERNAME/$KIRO_REPO_NAME"
    echo ""
}

# Show help
show_help() {
    echo "Kiro Repository Separation - Master Setup Script"
    echo ""
    echo "This script guides you through the complete process of separating"
    echo "the .kiro folder into a private repository."
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup         Run complete setup (default)"
    echo "  check         Check prerequisites only"
    echo "  config        Check configuration only"
    echo "  help          Show this help message"
    echo ""
    echo "Prerequisites:"
    echo "  - Git repository with .kiro folder"
    echo "  - GitHub CLI installed and authenticated"
    echo "  - Updated configuration in config.sh"
}

# Main script logic
case "${1:-setup}" in
    "setup")
        check_prerequisites
        check_configuration
        show_process
        backup_current_state
        run_setup
        ;;
    "check")
        check_prerequisites
        ;;
    "config")
        check_configuration
        ;;
    "help"|*)
        show_help
        ;;
esac