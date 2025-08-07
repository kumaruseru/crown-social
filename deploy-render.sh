#!/bin/bash

# Crown Social Network - Render Deployment Script
# This script prepares and pushes your code for Render deployment

echo "🚀 Crown Social Network - Render Deployment Preparation"
echo "════════════════════════════════════════════════════════"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    print_success "Git repository initialized"
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    print_warning "No remote origin found. Please add your GitHub repository:"
    echo "git remote add origin https://github.com/yourusername/crown-social.git"
    exit 1
fi

# Add all files to staging
print_status "Adding files to Git staging area..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    # Commit changes
    COMMIT_MESSAGE="Deploy Crown Social Network to Render with Socket.IO support - $(date '+%Y-%m-%d %H:%M:%S')"
    print_status "Committing changes with message: $COMMIT_MESSAGE"
    git commit -m "$COMMIT_MESSAGE"
    print_success "Changes committed successfully"
fi

# Push to main branch
print_status "Pushing to main branch..."
if git push origin main; then
    print_success "Code pushed successfully to GitHub!"
    echo ""
    print_status "🎉 Ready for Render deployment!"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Go to https://render.com/dashboard"
    echo "2. Click 'New' → 'Web Service'"
    echo "3. Connect your GitHub repository"
    echo "4. Use these settings:"
    echo "   - Build Command: npm install"
    echo "   - Start Command: npm start"
    echo "   - Environment: Node"
    echo "5. Add environment variables (see DEPLOY_RENDER.md)"
    echo "6. Click 'Create Web Service'"
    echo ""
    echo -e "${GREEN}Your app will be available at:${NC} https://your-service-name.onrender.com"
    echo ""
    echo -e "${YELLOW}📖 Read DEPLOY_RENDER.md for detailed instructions${NC}"
else
    print_error "Failed to push to GitHub. Please check your remote configuration."
    echo "Run: git remote -v to check your remote URLs"
fi

echo ""
print_status "Deployment preparation complete!"
