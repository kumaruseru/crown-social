#!/usr/bin/env node

/**
 * Crown Social Network - Conflict Detection and Resolution Tool
 * Checks for conflicts, dependencies, and integration issues
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ConflictChecker {
    constructor() {
        this.projectRoot = process.cwd();
        this.conflicts = [];
        this.warnings = [];
        this.suggestions = [];
        this.criticalIssues = [];
    }

    async checkAllConflicts() {
        console.log('🔍 Crown Social Network - Conflict Detection Suite');
        console.log('═'.repeat(60));
        
        try {
            await this.checkGitConflicts();
            await this.checkDependencyConflicts();
            await this.checkServiceConflicts();
            await this.checkPortConflicts();
            await this.checkFileSystemConflicts();
            await this.checkIntegrationConflicts();
            await this.checkSecurityConflicts();
            await this.validateConfiguration();
            
            this.generateConflictReport();
        } catch (error) {
            console.error('❌ Conflict check failed:', error);
            throw error;
        }
    }

    async checkGitConflicts() {
        console.log('\n🔀 Checking Git Conflicts...');
        
        try {
            // Check for merge conflicts
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            
            if (status.includes('UU ') || status.includes('AA ') || status.includes('DD ')) {
                this.conflicts.push({
                    type: 'Git Merge Conflict',
                    severity: 'Critical',
                    message: 'Unresolved merge conflicts detected',
                    solution: 'Resolve conflicts using git mergetool or manually'
                });
            }
            
            // Check for uncommitted changes
            if (status.trim()) {
                this.warnings.push({
                    type: 'Uncommitted Changes',
                    severity: 'Warning',
                    message: 'Working directory has uncommitted changes',
                    files: status.split('\n').filter(line => line.trim())
                });
            } else {
                console.log('✅ Git: No conflicts detected');
            }
            
            // Check branch status
            const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
            const remote = execSync('git status -uno', { encoding: 'utf8' });
            
            if (remote.includes('Your branch is behind')) {
                this.warnings.push({
                    type: 'Outdated Branch',
                    severity: 'Warning',
                    message: `Branch '${branch}' is behind remote`,
                    solution: 'Run: git pull origin ' + branch
                });
            }
            
        } catch (error) {
            this.warnings.push({
                type: 'Git Check Failed',
                severity: 'Warning',
                message: 'Could not check git status: ' + error.message
            });
        }
    }

    async checkDependencyConflicts() {
        console.log('\n📦 Checking Dependency Conflicts...');
        
        try {
            const packagePath = path.join(this.projectRoot, 'package.json');
            const packageContent = await fs.readFile(packagePath, 'utf8');
            const packageJson = JSON.parse(packageContent);
            
            // Check for peer dependency conflicts
            if (packageJson.peerDependencies) {
                console.log('🔍 Checking peer dependencies...');
                // This would require more complex analysis
            }
            
            // Check for version conflicts in dependencies
            const allDeps = {
                ...packageJson.dependencies || {},
                ...packageJson.devDependencies || {}
            };
            
            // Look for potential version conflicts
            const versionConflicts = [];
            for (const [pkg, version] of Object.entries(allDeps)) {
                if (version.includes('^') || version.includes('~')) {
                    // These are generally safe ranges
                } else if (version === '*' || version === 'latest') {
                    versionConflicts.push({
                        package: pkg,
                        version: version,
                        issue: 'Unpinned version could cause instability'
                    });
                }
            }
            
            if (versionConflicts.length > 0) {
                this.warnings.push({
                    type: 'Version Conflicts',
                    severity: 'Warning',
                    message: 'Potentially unstable package versions detected',
                    details: versionConflicts
                });
            }
            
            console.log('✅ Dependencies: Basic check completed');
            
        } catch (error) {
            this.conflicts.push({
                type: 'Package.json Error',
                severity: 'Critical',
                message: 'Could not read or parse package.json',
                error: error.message
            });
        }
    }

    async checkServiceConflicts() {
        console.log('\n🛠️ Checking Service Conflicts...');
        
        try {
            // Check services index
            const servicesPath = path.join(this.projectRoot, 'src', 'services', 'index.js');
            const servicesContent = await fs.readFile(servicesPath, 'utf8');
            
            // Look for duplicate service registrations
            const serviceNames = [];
            const lines = servicesContent.split('\n');
            
            lines.forEach((line, index) => {
                const match = line.match(/(\w+Service)\s*:/);
                if (match) {
                    const serviceName = match[1];
                    if (serviceNames.includes(serviceName)) {
                        this.conflicts.push({
                            type: 'Duplicate Service',
                            severity: 'Critical',
                            message: `Duplicate service registration: ${serviceName}`,
                            location: `services/index.js:${index + 1}`
                        });
                    }
                    serviceNames.push(serviceName);
                }
            });
            
            // Check for missing service files
            const servicePromises = serviceNames.map(async serviceName => {
                const servicePath = path.join(this.projectRoot, 'src', 'services');
                // This would check if service files exist
                return serviceName;
            });
            
            await Promise.all(servicePromises);
            
            console.log(`✅ Services: ${serviceNames.length} services registered`);
            
        } catch (error) {
            this.conflicts.push({
                type: 'Service Index Error',
                severity: 'Critical',
                message: 'Could not check service index',
                error: error.message
            });
        }
    }

    async checkPortConflicts() {
        console.log('\n🔌 Checking Port Conflicts...');
        
        const portsToCheck = [3000, 3443, 27017, 6379]; // HTTP, HTTPS, MongoDB, Redis
        
        for (const port of portsToCheck) {
            try {
                const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
                if (result.trim()) {
                    const processes = result.split('\n').filter(line => line.trim());
                    
                    if (processes.length > 1) {
                        this.warnings.push({
                            type: 'Port Conflict',
                            severity: 'Warning',
                            message: `Port ${port} has multiple processes`,
                            details: processes
                        });
                    }
                }
            } catch (error) {
                // Port not in use (which is actually good for some ports)
                if (port === 3000 || port === 3443) {
                    this.warnings.push({
                        type: 'Port Not In Use',
                        severity: 'Info',
                        message: `Application port ${port} not currently in use`
                    });
                }
            }
        }
        
        console.log('✅ Ports: Conflict check completed');
    }

    async checkFileSystemConflicts() {
        console.log('\n📁 Checking File System Conflicts...');
        
        try {
            // Check for duplicate files
            const duplicateFiles = await this.findDuplicateFiles();
            
            if (duplicateFiles.length > 0) {
                this.warnings.push({
                    type: 'Duplicate Files',
                    severity: 'Warning',
                    message: 'Potential duplicate files detected',
                    files: duplicateFiles
                });
            }
            
            // Check for missing critical files
            const criticalFiles = [
                'package.json',
                'server.js',
                'src/CrownApplication.js',
                'src/services/index.js'
            ];
            
            for (const file of criticalFiles) {
                const filePath = path.join(this.projectRoot, file);
                try {
                    await fs.access(filePath);
                } catch (error) {
                    this.criticalIssues.push({
                        type: 'Missing Critical File',
                        severity: 'Critical',
                        message: `Missing required file: ${file}`,
                        solution: 'Restore file from backup or repository'
                    });
                }
            }
            
            console.log('✅ File System: Check completed');
            
        } catch (error) {
            this.warnings.push({
                type: 'File System Check Error',
                severity: 'Warning',
                message: 'Could not complete file system check',
                error: error.message
            });
        }
    }

    async findDuplicateFiles() {
        // Simplified duplicate file detection
        const duplicates = [];
        
        try {
            // Check for common duplicate patterns
            const jsFiles = await this.findFiles(this.projectRoot, '.js');
            const fileNames = {};
            
            jsFiles.forEach(file => {
                const basename = path.basename(file);
                if (fileNames[basename]) {
                    duplicates.push({
                        name: basename,
                        paths: [fileNames[basename], file]
                    });
                } else {
                    fileNames[basename] = file;
                }
            });
            
        } catch (error) {
            console.error('Error finding duplicates:', error.message);
        }
        
        return duplicates;
    }

    async findFiles(dir, extension, fileList = []) {
        try {
            const files = await fs.readdir(dir);
            
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = await fs.stat(filePath);
                
                if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                    await this.findFiles(filePath, extension, fileList);
                } else if (stat.isFile() && file.endsWith(extension)) {
                    fileList.push(filePath);
                }
            }
        } catch (error) {
            // Skip inaccessible directories
        }
        
        return fileList;
    }

    async checkIntegrationConflicts() {
        console.log('\n🌐 Checking Integration Conflicts...');
        
        try {
            // Check Deep Integration services
            const integrationServices = [
                'src/services/Integration/DeepLanguageIntegrationService.js',
                'src/services/Integration/CrossLanguageCommunicationProtocol.js',
                'src/services/Integration/NativeBridgeService.js',
                'src/services/Integration/LanguageOrchestrator.js'
            ];
            
            for (const service of integrationServices) {
                const servicePath = path.join(this.projectRoot, service);
                try {
                    const content = await fs.readFile(servicePath, 'utf8');
                    
                    // Check for potential conflicts in service definitions
                    if (content.includes('class ') && content.includes('constructor')) {
                        // Basic syntax check
                        const classMatches = content.match(/class\s+(\w+)/g);
                        if (classMatches && classMatches.length > 1) {
                            this.warnings.push({
                                type: 'Multiple Classes',
                                severity: 'Warning',
                                message: `Multiple classes in ${service}`,
                                classes: classMatches
                            });
                        }
                    }
                    
                } catch (error) {
                    this.criticalIssues.push({
                        type: 'Missing Integration Service',
                        severity: 'Critical',
                        message: `Integration service not found: ${service}`,
                        solution: 'Restore service file or recreate it'
                    });
                }
            }
            
            console.log('✅ Integration: Check completed');
            
        } catch (error) {
            this.warnings.push({
                type: 'Integration Check Error',
                severity: 'Warning',
                message: 'Could not check integration services',
                error: error.message
            });
        }
    }

    async checkSecurityConflicts() {
        console.log('\n🔒 Checking Security Conflicts...');
        
        try {
            // Check for conflicting security configurations
            const securityFiles = [
                'src/services/Security/EnhancedSecurityService.js',
                'src/middleware/security.js',
                'src/config/security.js'
            ];
            
            let securityConfigs = 0;
            
            for (const file of securityFiles) {
                const filePath = path.join(this.projectRoot, file);
                try {
                    await fs.access(filePath);
                    securityConfigs++;
                } catch (error) {
                    // File doesn't exist
                }
            }
            
            if (securityConfigs === 0) {
                this.criticalIssues.push({
                    type: 'No Security Configuration',
                    severity: 'Critical',
                    message: 'No security configuration files found',
                    solution: 'Implement security middleware and configurations'
                });
            }
            
            // Check for hardcoded secrets (basic check)
            const mainFiles = ['server.js', 'src/CrownApplication.js'];
            
            for (const file of mainFiles) {
                const filePath = path.join(this.projectRoot, file);
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    // Look for potential hardcoded secrets
                    const secretPatterns = [
                        /password\s*[:=]\s*['"][^'"]{6,}['"]/i,
                        /secret\s*[:=]\s*['"][^'"]{10,}['"]/i,
                        /key\s*[:=]\s*['"][^'"]{20,}['"]/i
                    ];
                    
                    secretPatterns.forEach((pattern, index) => {
                        if (pattern.test(content)) {
                            this.warnings.push({
                                type: 'Potential Hardcoded Secret',
                                severity: 'Security Warning',
                                message: `Possible hardcoded secret in ${file}`,
                                solution: 'Move secrets to environment variables'
                            });
                        }
                    });
                    
                } catch (error) {
                    // File doesn't exist or can't read
                }
            }
            
            console.log('✅ Security: Check completed');
            
        } catch (error) {
            this.warnings.push({
                type: 'Security Check Error',
                severity: 'Warning',
                message: 'Could not complete security check',
                error: error.message
            });
        }
    }

    async validateConfiguration() {
        console.log('\n⚙️ Validating Configuration...');
        
        try {
            // Check environment variables
            const requiredEnvVars = [
                'NODE_ENV',
                'MONGODB_URI',
                'JWT_SECRET',
                'GOOGLE_CLIENT_ID'
            ];
            
            const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
            
            if (missingEnvVars.length > 0) {
                this.warnings.push({
                    type: 'Missing Environment Variables',
                    severity: 'Warning',
                    message: 'Required environment variables not set',
                    variables: missingEnvVars,
                    solution: 'Set environment variables or create .env file'
                });
            }
            
            // Check configuration files
            const configFiles = [
                'config/app.js',
                '.env.example'
            ];
            
            for (const configFile of configFiles) {
                const filePath = path.join(this.projectRoot, configFile);
                try {
                    await fs.access(filePath);
                } catch (error) {
                    this.warnings.push({
                        type: 'Missing Config File',
                        severity: 'Warning',
                        message: `Configuration file not found: ${configFile}`,
                        solution: 'Create configuration file with appropriate settings'
                    });
                }
            }
            
            console.log('✅ Configuration: Validation completed');
            
        } catch (error) {
            this.warnings.push({
                type: 'Configuration Check Error',
                severity: 'Warning',
                message: 'Could not validate configuration',
                error: error.message
            });
        }
    }

    generateConflictReport() {
        console.log('\n📋 CONFLICT DETECTION REPORT');
        console.log('═'.repeat(60));
        
        const totalIssues = this.conflicts.length + this.warnings.length + this.criticalIssues.length;
        
        console.log(`📊 Summary:
   🚨 Critical Issues: ${this.criticalIssues.length}
   ⚔️ Conflicts: ${this.conflicts.length}
   ⚠️ Warnings: ${this.warnings.length}
   📝 Total Issues: ${totalIssues}`);
        
        if (this.criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES (Requires Immediate Attention):');
            this.criticalIssues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.type}: ${issue.message}`);
                if (issue.solution) {
                    console.log(`   💡 Solution: ${issue.solution}`);
                }
            });
        }
        
        if (this.conflicts.length > 0) {
            console.log('\n⚔️ CONFLICTS:');
            this.conflicts.forEach((conflict, index) => {
                console.log(`${index + 1}. ${conflict.type} (${conflict.severity}): ${conflict.message}`);
                if (conflict.solution) {
                    console.log(`   💡 Solution: ${conflict.solution}`);
                }
                if (conflict.details) {
                    console.log(`   📋 Details: ${JSON.stringify(conflict.details, null, 2)}`);
                }
            });
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.warnings.slice(0, 10).forEach((warning, index) => {
                console.log(`${index + 1}. ${warning.type}: ${warning.message}`);
                if (warning.solution) {
                    console.log(`   💡 Solution: ${warning.solution}`);
                }
            });
            
            if (this.warnings.length > 10) {
                console.log(`   ... and ${this.warnings.length - 10} more warnings`);
            }
        }
        
        console.log('\n🎯 RECOMMENDATIONS:');
        
        if (totalIssues === 0) {
            console.log('   ✅ Excellent! No conflicts detected.');
            console.log('   🚀 Your Crown Social Network is ready for deployment!');
        } else if (this.criticalIssues.length === 0 && this.conflicts.length === 0) {
            console.log('   ✅ Good! Only minor warnings detected.');
            console.log('   🔧 Address warnings when convenient for optimal performance.');
        } else if (this.criticalIssues.length === 0) {
            console.log('   ⚠️ Moderate issues detected.');
            console.log('   🛠️ Resolve conflicts before deployment to ensure stability.');
        } else {
            console.log('   🚨 Critical issues require immediate attention!');
            console.log('   ⛔ Do not deploy until critical issues are resolved.');
        }
        
        console.log('\n🔧 NEXT STEPS:');
        console.log('   1. Address critical issues first');
        console.log('   2. Resolve any conflicts');
        console.log('   3. Review and fix warnings');
        console.log('   4. Run stress test: node tests/stress-test.js');
        console.log('   5. Test deployment in staging environment');
        
        console.log('═'.repeat(60));
    }
}

// Run conflict checker if called directly
if (require.main === module) {
    const checker = new ConflictChecker();
    checker.checkAllConflicts()
        .then(() => {
            console.log('\n🎉 Conflict check completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Conflict check failed:', error);
            process.exit(1);
        });
}

module.exports = ConflictChecker;
