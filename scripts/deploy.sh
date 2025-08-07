#!/bin/bash

# Docker deployment script for Crown application
# Supports both development and production environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
BUILD_CLEAN=false
SHOW_LOGS=false

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENVIRONMENT    Set environment (development|production) [default: development]"
    echo "  -c, --clean             Clean build (remove volumes and images)"
    echo "  -l, --logs              Show logs after deployment"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e development       # Deploy development environment"
    echo "  $0 -e production -c     # Clean production deployment"
    echo "  $0 -e development -l    # Deploy development and show logs"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -c|--clean)
            BUILD_CLEAN=true
            shift
            ;;
        -l|--logs)
            SHOW_LOGS=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}Error: Environment must be 'development' or 'production'${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Deploying Crown application in ${ENVIRONMENT} mode${NC}"

# Clean up if requested
if [[ "$BUILD_CLEAN" == true ]]; then
    echo -e "${YELLOW}🧹 Cleaning up existing containers and volumes...${NC}"
    
    if [[ "$ENVIRONMENT" == "development" ]]; then
        docker-compose -f docker-compose.dev.yml down -v
        docker system prune -f
    else
        docker-compose down -v
        docker system prune -f
    fi
fi

# Generate SSL certificates if they don't exist
if [[ ! -f "docker/ssl/cert.pem" || ! -f "docker/ssl/key.pem" ]]; then
    echo -e "${YELLOW}🔐 Generating SSL certificates...${NC}"
    bash scripts/generate-ssl.sh
fi

# Copy environment file
if [[ ! -f ".env" ]]; then
    echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  Please update .env file with your actual values before running in production!${NC}"
fi

# Build and start services
echo -e "${GREEN}🏗️  Building and starting services...${NC}"

if [[ "$ENVIRONMENT" == "development" ]]; then
    docker-compose -f docker-compose.dev.yml up --build -d
    
    echo -e "${GREEN}✅ Development environment started successfully!${NC}"
    echo -e "${BLUE}📱 Application: http://localhost:3000${NC}"
    echo -e "${BLUE}🗄️  MongoDB: mongodb://localhost:27017${NC}"
    echo -e "${BLUE}🔴 Redis: redis://localhost:6379${NC}"
    
    if [[ "$SHOW_LOGS" == true ]]; then
        echo -e "${YELLOW}📋 Showing application logs...${NC}"
        docker-compose -f docker-compose.dev.yml logs -f crown-app-dev
    fi
else
    docker-compose up --build -d
    
    echo -e "${GREEN}✅ Production environment started successfully!${NC}"
    echo -e "${BLUE}🌐 Application: https://localhost (via Nginx)${NC}"
    echo -e "${BLUE}📊 Prometheus: http://localhost:9090${NC}"
    echo -e "${BLUE}📈 Grafana: http://localhost:3001${NC}"
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
    sleep 10
    
    # Check health
    echo -e "${YELLOW}🏥 Checking service health...${NC}"
    curl -f http://localhost/health || echo -e "${RED}❌ Health check failed${NC}"
    
    if [[ "$SHOW_LOGS" == true ]]; then
        echo -e "${YELLOW}📋 Showing application logs...${NC}"
        docker-compose logs -f crown-app
    fi
fi

echo -e "${GREEN}🎉 Deployment completed!${NC}"
