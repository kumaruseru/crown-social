
🚀 CROWN SOCIAL NETWORK - cPanel DEPLOYMENT GUIDE
═══════════════════════════════════════════════════

📍 Domain: cown.name.vn
🏢 Hosting: cPanel
🗂️  Deployment Directory: crown-app/

📋 DEPLOYMENT STEPS:
════════════════════

1️⃣ PREPARE HOSTING ENVIRONMENT
   □ Login to your cPanel (cown.name.vn/cpanel)
   □ Enable Node.js in "Software" section
   □ Set Node.js version to 18+ 
   □ Create application directory: crown-app

2️⃣ UPLOAD FILES
   □ Compress project files (excluding node_modules)
   □ Upload via File Manager to crown-app/
   □ Extract files in crown-app/ directory
   □ Copy files from deploy-cpanel/ to crown-app/

3️⃣ CONFIGURE DATABASE
   □ Create MongoDB Atlas account (free tier)
   □ Create cluster and database: crown-production
   □ Whitelist your hosting server IP
   □ Update MONGODB_URI in .env.production

4️⃣ INSTALL DEPENDENCIES
   □ In cPanel Terminal or SSH:
     cd crown-app
     npm install --production
   
5️⃣ CONFIGURE ENVIRONMENT
   □ Rename .env.production to .env
   □ Update all configuration values:
     - JWT_SECRET (use strong random string)
     - SESSION_SECRET (use strong random string)  
     - Email SMTP settings
     - OAuth app credentials
     - Database connection string

6️⃣ SETUP DOMAIN & SSL
   □ Point domain cown.name.vn to your hosting
   □ Install SSL certificate (Let's Encrypt recommended)
   □ Configure subdomain if needed

7️⃣ START APPLICATION
   □ In cPanel Node.js interface:
     - Set startup file: app.js
     - Set Node.js version: 18+
     - Click "Restart" to start app
   
8️⃣ VERIFY DEPLOYMENT
   □ Visit https://cown.name.vn/health
   □ Check https://cown.name.vn/api/health
   □ Test login functionality
   □ Verify Socket.IO connection

🔧 CONFIGURATION FILES:
═══════════════════════
✅ app.js - cPanel entry point
✅ .htaccess - Apache configuration
✅ web.config - IIS configuration (if needed)
✅ .env.production - Production environment
✅ package-prod.json - Production dependencies

⚠️ IMPORTANT NOTES:
══════════════════
• Update all secrets and passwords
• Configure OAuth apps for production domain
• Test thoroughly before going live
• Setup monitoring and backups
• Configure email service properly

🔗 USEFUL LINKS:
════════════════
• MongoDB Atlas: https://cloud.mongodb.com
• Let's Encrypt SSL: https://letsencrypt.org
• Google OAuth Console: https://console.developers.google.com
• Facebook Developers: https://developers.facebook.com

📞 SUPPORT:
═══════════
If you need help with deployment, provide:
• cPanel login access
• Domain DNS settings
• Any error messages

🎉 Once deployed, your Crown Social Network will be live at:
   https://cown.name.vn
