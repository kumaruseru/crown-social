# Crown Application - Docker Deployment Guide

This guide explains how to deploy the Crown application using Docker with modern security and monitoring features.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (for development)
- Git

### Development Environment

```bash
# Clone and setup
git clone <repository-url>
cd crown2

# Copy environment file and configure
cp .env.example .env
# Edit .env with your actual values

# Generate SSL certificates
npm run docker:ssl

# Start development environment
npm run docker:dev

# View logs
npm run docker:dev:logs
```

### Production Environment

```bash
# Generate SSL certificates
npm run docker:ssl

# Deploy production environment
npm run docker:deploy:prod

# Check health
npm run docker:health
```

## 📋 Available Commands

### Development Commands
```bash
npm run docker:dev              # Start development environment
npm run docker:dev:detached     # Start development in background
npm run docker:dev:logs         # View development logs
npm run docker:dev:stop         # Stop development environment
npm run docker:dev:clean        # Clean development environment
```

### Production Commands
```bash
npm run docker:prod             # Start production environment
npm run docker:prod:logs        # View production logs
npm run docker:prod:stop        # Stop production environment
npm run docker:prod:clean       # Clean production environment
```

### SSL & Security
```bash
npm run docker:ssl              # Generate SSL certificates (Linux/macOS)
npm run docker:ssl:win          # Generate SSL certificates (Windows)
```

### Deployment Scripts
```bash
npm run docker:deploy:dev       # Deploy development (Linux/macOS)
npm run docker:deploy:prod      # Deploy production (Linux/macOS)
npm run docker:deploy:dev:win   # Deploy development (Windows)
npm run docker:deploy:prod:win  # Deploy production (Windows)
```

## 🏗️ Architecture Overview

### Services

| Service | Purpose | Port | Health Check |
|---------|---------|------|--------------|
| **crown-app** | Main application | 3000 | `/health` |
| **crown-db** | MongoDB database | 27017 | Built-in |
| **crown-redis** | Redis cache | 6379 | Built-in |
| **crown-nginx** | Reverse proxy + SSL | 80/443 | Built-in |
| **crown-prometheus** | Metrics collection | 9090 | Built-in |
| **crown-grafana** | Monitoring dashboard | 3001 | Built-in |

### Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| **SSL** | Self-signed | Self-signed (can be replaced) |
| **Monitoring** | Basic logs | Prometheus + Grafana |
| **Hot Reload** | ✅ Enabled | ❌ Disabled |
| **Debug Mode** | ✅ Enabled | ❌ Disabled |
| **Source Maps** | ✅ Enabled | ❌ Disabled |
| **Reverse Proxy** | ❌ Direct access | ✅ Nginx |
| **Security Headers** | Basic | Full helmet.js |
| **Rate Limiting** | Relaxed | Strict |

## 🔒 Security Features

### Container Security
- ✅ Non-root user (crown:1001)
- ✅ Minimal Alpine base image
- ✅ Security updates applied
- ✅ Read-only root filesystem (where possible)
- ✅ No privileged containers
- ✅ Resource limits applied

### Application Security
- ✅ Helmet.js security headers
- ✅ Rate limiting (API: 100req/15min, Login: 5req/15min)
- ✅ Input sanitization
- ✅ HTTPS enforcement (production)
- ✅ Secure session configuration
- ✅ CSP (Content Security Policy)
- ✅ Security logging

### Network Security
- ✅ Internal Docker network isolation
- ✅ Only necessary ports exposed
- ✅ SSL/TLS encryption
- ✅ Proxy trust configuration

## 📊 Monitoring & Observability

### Health Checks
```bash
# Application health
curl http://localhost/health

# Individual service health
docker-compose ps
```

### Metrics & Monitoring
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Application Metrics**: http://localhost/metrics

### Logs
```bash
# Application logs
docker-compose logs -f crown-app

# All services logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f crown-db
```

## 🛠️ Configuration

### Environment Variables

Key configuration files:
- `.env` - Main environment configuration
- `.env.example` - Template with all available options
- `docker-compose.yml` - Production environment
- `docker-compose.dev.yml` - Development environment

### SSL Certificates

SSL certificates are automatically generated for development:
```
docker/ssl/
├── cert.pem     # Certificate
├── key.pem      # Private key
└── dhparam.pem  # Diffie-Hellman parameters
```

For production, replace with valid certificates from a Certificate Authority.

### Database Configuration

MongoDB is configured with:
- Authentication enabled
- Data persistence via Docker volumes
- Automatic initialization script
- Health checks

### Redis Configuration

Redis is configured with:
- Password authentication
- Data persistence
- Memory limits
- Health checks

## 🚨 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using ports
netstat -tlnp | grep :3000
netstat -tlnp | grep :80

# Stop conflicting services
sudo systemctl stop apache2  # If Apache is running
sudo systemctl stop nginx    # If Nginx is running
```

**Permission issues:**
```bash
# Fix SSL certificate permissions
sudo chown -R $USER:$USER docker/ssl/
chmod 600 docker/ssl/key.pem
chmod 644 docker/ssl/cert.pem
```

**Container startup issues:**
```bash
# Check container logs
docker-compose logs crown-app

# Check container status
docker-compose ps

# Rebuild containers
docker-compose down
docker-compose up --build
```

### Debug Mode

Enable debug logging by setting in `.env`:
```bash
DEBUG=crown:*
LOG_LEVEL=debug
```

### Performance Issues

Monitor resource usage:
```bash
# Check container resource usage
docker stats

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -f
```

## 🔄 Updates & Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
npm run docker:prod:clean
npm run docker:deploy:prod
```

### Database Backups

Automatic backups can be configured via environment variables:
```bash
BACKUP_SCHEDULE=0 2 * * *        # Daily at 2 AM
BACKUP_RETENTION_DAYS=30         # Keep 30 days
```

### Security Updates

Regularly update base images:
```bash
# Update base images
docker-compose pull

# Rebuild with latest images
docker-compose up --build --force-recreate
```

## 📞 Support

If you encounter issues:

1. Check the logs: `npm run docker:logs`
2. Verify health checks: `npm run docker:health`
3. Review environment configuration: `.env`
4. Check Docker resources: `docker system df`
5. Consult this documentation

For additional help, please refer to the main project documentation or open an issue in the repository.
