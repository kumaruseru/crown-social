# Docker deployment script for Crown application (Windows PowerShell)
# Supports both development and production environments

param(
    [string]$Environment = "development",
    [switch]$Clean,
    [switch]$Logs,
    [switch]$Help
)

# Function to display usage
function Show-Usage {
    Write-Host "Usage: .\deploy.ps1 [OPTIONS]" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -Environment <env>      Set environment (development|production) [default: development]"
    Write-Host "  -Clean                  Clean build (remove volumes and images)"
    Write-Host "  -Logs                   Show logs after deployment"
    Write-Host "  -Help                   Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\deploy.ps1 -Environment development       # Deploy development environment"
    Write-Host "  .\deploy.ps1 -Environment production -Clean # Clean production deployment"
    Write-Host "  .\deploy.ps1 -Environment development -Logs # Deploy development and show logs"
}

# Show help if requested
if ($Help) {
    Show-Usage
    exit 0
}

# Validate environment
if ($Environment -notin @("development", "production")) {
    Write-Host "Error: Environment must be 'development' or 'production'" -ForegroundColor Red
    Show-Usage
    exit 1
}

Write-Host "🚀 Deploying Crown application in $Environment mode" -ForegroundColor Blue

# Clean up if requested
if ($Clean) {
    Write-Host "🧹 Cleaning up existing containers and volumes..." -ForegroundColor Yellow
    
    try {
        if ($Environment -eq "development") {
            docker-compose -f docker-compose.dev.yml down -v
        } else {
            docker-compose down -v
        }
        docker system prune -f
    } catch {
        Write-Host "Warning: Some cleanup operations failed" -ForegroundColor Yellow
    }
}

# Generate SSL certificates if they don't exist
if (!(Test-Path "docker\ssl\cert.pem") -or !(Test-Path "docker\ssl\key.pem")) {
    Write-Host "🔐 Generating SSL certificates..." -ForegroundColor Yellow
    .\scripts\generate-ssl.ps1
}

# Copy environment file
if (!(Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "⚠️  Please update .env file with your actual values before running in production!" -ForegroundColor Red
}

# Build and start services
Write-Host "🏗️  Building and starting services..." -ForegroundColor Green

try {
    if ($Environment -eq "development") {
        docker-compose -f docker-compose.dev.yml up --build -d
        
        Write-Host "✅ Development environment started successfully!" -ForegroundColor Green
        Write-Host "📱 Application: http://localhost:3000" -ForegroundColor Blue
        Write-Host "🗄️  MongoDB: mongodb://localhost:27017" -ForegroundColor Blue
        Write-Host "🔴 Redis: redis://localhost:6379" -ForegroundColor Blue
        
        if ($Logs) {
            Write-Host "📋 Showing application logs..." -ForegroundColor Yellow
            docker-compose -f docker-compose.dev.yml logs -f crown-app-dev
        }
    } else {
        docker-compose up --build -d
        
        Write-Host "✅ Production environment started successfully!" -ForegroundColor Green
        Write-Host "🌐 Application: https://localhost (via Nginx)" -ForegroundColor Blue
        Write-Host "📊 Prometheus: http://localhost:9090" -ForegroundColor Blue
        Write-Host "📈 Grafana: http://localhost:3001" -ForegroundColor Blue
        
        # Wait for services to be ready
        Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
        Start-Sleep 10
        
        # Check health
        Write-Host "🏥 Checking service health..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Health check passed" -ForegroundColor Green
            }
        } catch {
            Write-Host "❌ Health check failed" -ForegroundColor Red
        }
        
        if ($Logs) {
            Write-Host "📋 Showing application logs..." -ForegroundColor Yellow
            docker-compose logs -f crown-app
        }
    }
    
    Write-Host "🎉 Deployment completed!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
