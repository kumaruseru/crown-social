const net = require('net');

class PortManager {
    constructor() {
        this.reservedPorts = new Set();
    }

    /**
     * Check if a port is available
     */
    async isPortAvailable(port, host = 'localhost') {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.listen(port, host, () => {
                server.once('close', () => resolve(true));
                server.close();
            });
            
            server.on('error', () => resolve(false));
        });
    }

    /**
     * Find an available port starting from a base port
     */
    async findAvailablePort(basePort = 3000, maxAttempts = 100) {
        for (let i = 0; i < maxAttempts; i++) {
            const port = basePort + i;
            if (!this.reservedPorts.has(port) && await this.isPortAvailable(port)) {
                this.reservedPorts.add(port);
                console.log(`✅ Found available port: ${port}`);
                return port;
            }
        }
        throw new Error(`No available port found starting from ${basePort}`);
    }

    /**
     * Get available ports for HTTP and HTTPS
     */
    async getAvailablePorts() {
        const httpPort = await this.findAvailablePort(3000);
        const httpsPort = await this.findAvailablePort(3443);
        
        return { httpPort, httpsPort };
    }

    /**
     * Release a reserved port
     */
    releasePort(port) {
        this.reservedPorts.delete(port);
        console.log(`🔓 Released port: ${port}`);
    }

    /**
     * Kill processes using specific ports
     */
    async killProcessOnPorts(ports) {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);

        for (const port of ports) {
            try {
                console.log(`🔍 Checking for processes on port ${port}...`);
                
                // Find process using port
                const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
                
                if (stdout.trim()) {
                    const lines = stdout.trim().split('\n');
                    const pids = new Set();
                    
                    lines.forEach(line => {
                        const parts = line.trim().split(/\s+/);
                        const pid = parts[parts.length - 1];
                        if (pid && pid !== '0' && !isNaN(pid)) {
                            pids.add(pid);
                        }
                    });
                    
                    for (const pid of pids) {
                        try {
                            await execAsync(`taskkill /F /PID ${pid}`);
                            console.log(`💀 Killed process ${pid} on port ${port}`);
                        } catch (killError) {
                            console.log(`⚠️ Could not kill process ${pid}: ${killError.message}`);
                        }
                    }
                } else {
                    console.log(`✅ No processes found on port ${port}`);
                }
            } catch (error) {
                console.log(`⚠️ Error checking port ${port}: ${error.message}`);
            }
        }
    }

    /**
     * Check and display port status
     */
    async checkPortStatus(ports) {
        console.log('\n🔍 Port Status Check:');
        console.log('────────────────────────');
        
        for (const port of ports) {
            const available = await this.isPortAvailable(port);
            const status = available ? '🟢 Available' : '🔴 In Use';
            console.log(`Port ${port}: ${status}`);
        }
        console.log('────────────────────────\n');
    }
}

module.exports = PortManager;
