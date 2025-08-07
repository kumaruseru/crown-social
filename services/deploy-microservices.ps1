# Crown Microservices Deployment Script (PowerShell)
# Crown Social Network Polyglot Architecture Deployment

Write-Host "🚀 Starting Crown Social Network Microservices Deployment" -ForegroundColor Green

# Check if Docker and Docker Compose are installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Desktop with Compose." -ForegroundColor Red
    exit 1
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "uploads\media"
New-Item -ItemType Directory -Force -Path "uploads\avatars"
New-Item -ItemType Directory -Force -Path "models"
New-Item -ItemType Directory -Force -Path "logs"
New-Item -ItemType Directory -Force -Path "docker\ssl"

# Generate SSL certificates if they don't exist
if (!(Test-Path "docker\ssl\crown.crt")) {
    Write-Host "🔐 Generating SSL certificates..." -ForegroundColor Yellow
    
    # Check if OpenSSL is available
    if (Get-Command openssl -ErrorAction SilentlyContinue) {
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
            -keyout docker\ssl\crown.key `
            -out docker\ssl\crown.crt `
            -subj "/C=US/ST=State/L=City/O=Crown/CN=localhost"
    } else {
        Write-Host "⚠️  OpenSSL not found. Skipping SSL certificate generation." -ForegroundColor Yellow
        Write-Host "   You can generate certificates manually later." -ForegroundColor Yellow
    }
}

# Build and start services
Write-Host "🏗️  Building and starting services..." -ForegroundColor Yellow
Set-Location services

docker-compose -f docker-compose.microservices.yml build --parallel

Write-Host "🌟 Starting Crown Microservices..." -ForegroundColor Green
docker-compose -f docker-compose.microservices.yml up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Health check all services
Write-Host "🏥 Performing health checks..." -ForegroundColor Yellow

$services = @(
    @{Name="crown-main"; Port=3000},
    @{Name="auth-service"; Port=3001},
    @{Name="feed-service"; Port=3002},
    @{Name="media-service"; Port=3003},
    @{Name="ai-service"; Port=3004},
    @{Name="notification-service"; Port=3005},
    @{Name="analytics-service"; Port=3006},
    @{Name="search-service"; Port=3007}
)

foreach ($service in $services) {
    Write-Host "Checking $($service.Name) on port $($service.Port)..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) is healthy" -ForegroundColor Green
        } else {
            Write-Host "❌ $($service.Name) returned status: $($response.StatusCode)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $($service.Name) is not responding" -ForegroundColor Red
    }
}

# Display service status
Write-Host "📊 Service Status:" -ForegroundColor Yellow
docker-compose -f docker-compose.microservices.yml ps

Write-Host ""
Write-Host "🎉 Crown Social Network Microservices Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Services Available:" -ForegroundColor Cyan
Write-Host "   Main Application: http://localhost:3000" -ForegroundColor White
Write-Host "   Auth Service: http://localhost:3001/health" -ForegroundColor White
Write-Host "   Feed Service: http://localhost:3002/health" -ForegroundColor White
Write-Host "   Media Service: http://localhost:3003/health" -ForegroundColor White
Write-Host "   AI Service: http://localhost:3004/health" -ForegroundColor White
Write-Host "   Notification Service: http://localhost:3005/health" -ForegroundColor White
Write-Host "   Analytics Service: http://localhost:3006/health" -ForegroundColor White
Write-Host "   Search Service: http://localhost:3007/health" -ForegroundColor White
Write-Host "   MongoDB: localhost:27017" -ForegroundColor White
Write-Host "   Redis: localhost:6379" -ForegroundColor White
Write-Host "   Elasticsearch: http://localhost:9200" -ForegroundColor White
Write-Host "   Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "   Grafana: http://localhost:3100 (admin/admin)" -ForegroundColor White
Write-Host ""
Write-Host "📝 To view logs:" -ForegroundColor Yellow
Write-Host "   docker-compose -f services/docker-compose.microservices.yml logs -f [service-name]" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop services:" -ForegroundColor Yellow
Write-Host "   docker-compose -f services/docker-compose.microservices.yml down" -ForegroundColor White
Write-Host ""
Write-Host "🔥 To rebuild and restart:" -ForegroundColor Yellow
Write-Host "   docker-compose -f services/docker-compose.microservices.yml down" -ForegroundColor White
Write-Host "   docker-compose -f services/docker-compose.microservices.yml build --no-cache" -ForegroundColor White
Write-Host "   docker-compose -f services/docker-compose.microservices.yml up -d" -ForegroundColor White
Write-Host ""
Write-Host "🏗️  Architecture:" -ForegroundColor Magenta
Write-Host "   🟦 TypeScript - Main coordination layer" -ForegroundColor Blue
Write-Host "   🦀 Rust - High-performance authentication" -ForegroundColor Red  
Write-Host "   🐹 Go - Real-time feed processing" -ForegroundColor Cyan
Write-Host "   🐍 Python - AI/ML content analysis" -ForegroundColor Green
Write-Host "   ⚡ C++ - Intensive media processing" -ForegroundColor Magenta
Write-Host "   💜 Elixir - Real-time notifications" -ForegroundColor DarkMagenta
Write-Host "   🔷 C#/.NET - Analytics and metrics" -ForegroundColor Blue
Write-Host "   ☕ Java/Kotlin - Advanced search engine" -ForegroundColor DarkYellow

Set-Location ..
