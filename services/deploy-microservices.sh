#!/bin/bash

# Crown Microservices Deployment Script
echo "🚀 Starting Crown Social Network Microservices Deployment"

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads/media
mkdir -p uploads/avatars
mkdir -p models
mkdir -p logs
mkdir -p docker/ssl

# Generate SSL certificates if they don't exist
if [ ! -f docker/ssl/crown.crt ]; then
    echo "🔐 Generating SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout docker/ssl/crown.key \
        -out docker/ssl/crown.crt \
        -subj "/C=US/ST=State/L=City/O=Crown/CN=localhost"
fi

# Set proper permissions
echo "🔧 Setting permissions..."
chmod -R 755 uploads/
chmod -R 755 models/
chmod -R 755 logs/
chmod 600 docker/ssl/crown.key
chmod 644 docker/ssl/crown.crt

# Build and start services
echo "🏗️  Building and starting services..."
cd services
docker-compose -f docker-compose.microservices.yml build --parallel

echo "🌟 Starting Crown Microservices..."
docker-compose -f docker-compose.microservices.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health check all services
echo "🏥 Performing health checks..."

services=("crown-main:3000" "auth-service:3001" "feed-service:3002" "media-service:3003" "ai-service:3004")

for service in "${services[@]}"; do
    IFS=':' read -ra ADDR <<< "$service"
    service_name=${ADDR[0]}
    port=${ADDR[1]}
    
    echo "Checking $service_name on port $port..."
    
    if curl -f "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $service_name is healthy"
    else
        echo "❌ $service_name is not responding"
    fi
done

# Display service status
echo "📊 Service Status:"
docker-compose -f docker-compose.microservices.yml ps

echo ""
echo "🎉 Crown Social Network Microservices Deployment Complete!"
echo ""
echo "🌐 Services Available:"
echo "   Main Application: http://localhost:3000"
echo "   Auth Service: http://localhost:3001/health"
echo "   Feed Service: http://localhost:3002/health"
echo "   Media Service: http://localhost:3003/health"
echo "   AI Service: http://localhost:3004/health"
echo "   MongoDB: localhost:27017"
echo "   Redis: localhost:6379"
echo "   Prometheus: http://localhost:9090"
echo "   Grafana: http://localhost:3001 (admin/admin)"
echo ""
echo "📝 To view logs:"
echo "   docker-compose -f services/docker-compose.microservices.yml logs -f [service-name]"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose -f services/docker-compose.microservices.yml down"
echo ""
echo "🔥 To rebuild and restart:"
echo "   docker-compose -f services/docker-compose.microservices.yml down"
echo "   docker-compose -f services/docker-compose.microservices.yml build --no-cache"
echo "   docker-compose -f services/docker-compose.microservices.yml up -d"
