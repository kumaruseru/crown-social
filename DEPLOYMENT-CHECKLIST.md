# 🚀 CROWN SOCIAL NETWORK DEPLOYMENT CHECKLIST

## Pre-Deployment Setup ✅

### 1. Hosting Environment
- [ ] cPanel account active and accessible
- [ ] Node.js enabled (version 18+)
- [ ] SSL certificate installed
- [ ] Domain pointing to hosting server

### 2. Database Setup
- [ ] MongoDB Atlas account created
- [ ] Cluster created and configured
- [ ] Database user created with full access
- [ ] Network access configured (0.0.0.0/0 or specific IPs)
- [ ] Connection string obtained and tested

### 3. Email Service
- [ ] Email hosting configured
- [ ] SMTP settings obtained
- [ ] Test email account created

### 4. OAuth Applications
- [ ] Google OAuth app created and configured
- [ ] Facebook app created and configured
- [ ] Callback URLs updated for production domain

## Deployment Process ✅

### 1. File Upload
- [ ] Project files uploaded to cPanel
- [ ] Files extracted in correct directory
- [ ] Permissions set correctly (755 for directories, 644 for files)

### 2. Configuration
- [ ] .env file created with production settings
- [ ] All secrets and passwords updated
- [ ] Database connection string configured
- [ ] OAuth credentials updated

### 3. Dependencies
- [ ] npm install completed successfully
- [ ] All required packages installed
- [ ] Node.js application configured in cPanel

### 4. Application Startup
- [ ] app.js set as startup file
- [ ] Application started without errors
- [ ] Health check endpoints responding

## Post-Deployment Testing ✅

### 1. Basic Functionality
- [ ] Homepage loads correctly (https://cown.name.vn)
- [ ] API endpoints responding (/api/health)
- [ ] Static files serving properly
- [ ] Database connections working

### 2. Authentication
- [ ] User registration working
- [ ] Login functionality working
- [ ] OAuth login (Google/Facebook) working
- [ ] JWT tokens generating properly

### 3. Features
- [ ] News feed loading
- [ ] Post creation working
- [ ] File uploads working
- [ ] Socket.IO real-time features working

### 4. Security
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] CORS properly configured

## Monitoring & Maintenance ✅

### 1. Regular Checks
- [ ] Application logs monitored
- [ ] Performance metrics tracked
- [ ] Database performance monitored
- [ ] SSL certificate expiration tracked

### 2. Backup Strategy
- [ ] Database backups configured
- [ ] File backups scheduled
- [ ] Recovery procedure documented

### 3. Updates
- [ ] Security updates planned
- [ ] Feature updates tested in staging
- [ ] Rollback procedure documented

---

🎯 **SUCCESS CRITERIA**
- All checklist items completed ✅
- Application accessible at https://cown.name.vn ✅  
- All core features working ✅
- Security measures in place ✅
- Monitoring configured ✅

🚀 **READY FOR PRODUCTION!**
