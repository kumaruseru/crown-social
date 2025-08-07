# Crown Social Network - Render Deployment Script (PowerShell)
# This script prepares and pushes your code for Render deployment

Write-Host "🚀 Crown Social Network - Render Deployment Preparation" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Function to print colored output
function Write-Status($message) {
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "[SUCCESS] $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "[WARNING] $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "[ERROR] $message" -ForegroundColor Red
}

# Check if git is initialized
if (!(Test-Path ".git")) {
    Write-Status "Initializing Git repository..."
    git init
    Write-Success "Git repository initialized"
}

# Check if remote origin exists
try {
    $null = git remote get-url origin 2>$null
} catch {
    Write-Warning "No remote origin found. Please add your GitHub repository:"
    Write-Host "git remote add origin https://github.com/yourusername/crown-social.git" -ForegroundColor White
    exit 1
}

# Add all files to staging
Write-Status "Adding files to Git staging area..."
git add .

# Check if there are changes to commit
$changes = git diff --staged --name-only
if ($changes.Count -eq 0) {
    Write-Warning "No changes to commit"
} else {
    # Commit changes
    $commitMessage = "Deploy Crown Social Network to Render with Socket.IO support - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Status "Committing changes with message: $commitMessage"
    git commit -m $commitMessage
    Write-Success "Changes committed successfully"
}

# Push to main branch
Write-Status "Pushing to main branch..."
try {
    git push origin main
    Write-Success "Code pushed successfully to GitHub!"
    Write-Host ""
    Write-Status "🎉 Ready for Render deployment!"
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Blue
    Write-Host "1. Go to https://render.com/dashboard"
    Write-Host "2. Click 'New' → 'Web Service'"
    Write-Host "3. Connect your GitHub repository"
    Write-Host "4. Use these settings:"
    Write-Host "   - Build Command: npm install"
    Write-Host "   - Start Command: npm start"
    Write-Host "   - Environment: Node"
    Write-Host "5. Add environment variables (see DEPLOY_RENDER.md)"
    Write-Host "6. Click 'Create Web Service'"
    Write-Host ""
    Write-Host "Your app will be available at: https://your-service-name.onrender.com" -ForegroundColor Green
    Write-Host ""
    Write-Host "📖 Read DEPLOY_RENDER.md for detailed instructions" -ForegroundColor Yellow
} catch {
    Write-Error "Failed to push to GitHub. Please check your remote configuration."
    Write-Host "Run: git remote -v to check your remote URLs"
}

Write-Host ""
Write-Status "Deployment preparation complete!"
