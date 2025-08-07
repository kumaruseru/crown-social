#!/bin/bash

# Container Security Scanning Script
# Sử dụng Trivy và Docker Bench để scan security

set -e

echo "🔍 Starting Container Security Scan..."
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="${IMAGE_NAME:-crown-app:latest}"
SCAN_OUTPUT_DIR="${SCAN_OUTPUT_DIR:-./security-reports}"
SEVERITY_THRESHOLD="${SEVERITY_THRESHOLD:-HIGH}"

# Create output directory
mkdir -p "$SCAN_OUTPUT_DIR"

echo -e "${BLUE}📋 Scan Configuration:${NC}"
echo "  - Image: $IMAGE_NAME"
echo "  - Output Directory: $SCAN_OUTPUT_DIR"
echo "  - Severity Threshold: $SEVERITY_THRESHOLD"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Trivy
install_trivy() {
    echo -e "${YELLOW}📦 Installing Trivy...${NC}"
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install trivy
    else
        echo -e "${RED}❌ Unsupported OS for automatic Trivy installation${NC}"
        echo "Please install Trivy manually: https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
        exit 1
    fi
}

# Function to install Docker Bench
install_docker_bench() {
    echo -e "${YELLOW}📦 Installing Docker Bench Security...${NC}"
    
    if [ ! -d "docker-bench-security" ]; then
        git clone https://github.com/docker/docker-bench-security.git
    fi
}

# Check and install dependencies
echo -e "${BLUE}🔧 Checking Dependencies...${NC}"

if ! command_exists trivy; then
    echo -e "${YELLOW}⚠️ Trivy not found. Installing...${NC}"
    install_trivy
else
    echo -e "${GREEN}✅ Trivy found${NC}"
fi

if ! command_exists docker; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Docker found${NC}"
fi

echo ""

# 1. Trivy Vulnerability Scan
echo -e "${BLUE}🔍 Running Trivy Vulnerability Scan...${NC}"
echo "----------------------------------------"

# Scan for vulnerabilities
trivy image \
    --severity "$SEVERITY_THRESHOLD,CRITICAL" \
    --format json \
    --output "$SCAN_OUTPUT_DIR/trivy-vulnerabilities.json" \
    "$IMAGE_NAME"

# Scan for misconfigurations
trivy config \
    --severity "$SEVERITY_THRESHOLD,CRITICAL" \
    --format json \
    --output "$SCAN_OUTPUT_DIR/trivy-misconfigurations.json" \
    .

# Generate human-readable report
trivy image \
    --severity "$SEVERITY_THRESHOLD,CRITICAL" \
    --format table \
    --output "$SCAN_OUTPUT_DIR/trivy-report.txt" \
    "$IMAGE_NAME"

echo -e "${GREEN}✅ Trivy scan completed${NC}"

# 2. Docker Bench Security
echo ""
echo -e "${BLUE}🔍 Running Docker Bench Security...${NC}"
echo "-----------------------------------"

if [ ! -d "docker-bench-security" ]; then
    install_docker_bench
fi

cd docker-bench-security
sudo ./docker-bench-security.sh > "../$SCAN_OUTPUT_DIR/docker-bench-report.txt" 2>&1
cd ..

echo -e "${GREEN}✅ Docker Bench scan completed${NC}"

# 3. Custom Security Checks
echo ""
echo -e "${BLUE}🔍 Running Custom Security Checks...${NC}"
echo "------------------------------------"

# Check Dockerfile best practices
check_dockerfile() {
    local issues=0
    
    echo "Checking Dockerfile security practices..."
    
    # Check if running as root
    if ! grep -q "USER " Dockerfile* 2>/dev/null; then
        echo "⚠️ WARNING: No USER instruction found - running as root"
        ((issues++))
    fi
    
    # Check for latest tag usage
    if grep -q "FROM.*:latest" Dockerfile* 2>/dev/null; then
        echo "⚠️ WARNING: Using 'latest' tag in base image"
        ((issues++))
    fi
    
    # Check for COPY/ADD without --chown
    if grep -E "^(COPY|ADD) [^-]" Dockerfile* 2>/dev/null | grep -v -- "--chown" >/dev/null; then
        echo "⚠️ WARNING: COPY/ADD without --chown found"
        ((issues++))
    fi
    
    # Check for hardcoded secrets
    if grep -iE "(password|secret|key|token)" Dockerfile* 2>/dev/null; then
        echo "🚨 CRITICAL: Potential hardcoded secrets in Dockerfile"
        ((issues++))
    fi
    
    return $issues
}

# Run Dockerfile checks
dockerfile_issues=0
check_dockerfile || dockerfile_issues=$?

# 4. Generate Security Report Summary
echo ""
echo -e "${BLUE}📊 Generating Security Report Summary...${NC}"
echo "==============================================="

# Parse Trivy results
if [ -f "$SCAN_OUTPUT_DIR/trivy-vulnerabilities.json" ]; then
    CRITICAL_VULNS=$(jq '.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL") | .VulnerabilityID' "$SCAN_OUTPUT_DIR/trivy-vulnerabilities.json" 2>/dev/null | wc -l || echo "0")
    HIGH_VULNS=$(jq '.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH") | .VulnerabilityID' "$SCAN_OUTPUT_DIR/trivy-vulnerabilities.json" 2>/dev/null | wc -l || echo "0")
else
    CRITICAL_VULNS=0
    HIGH_VULNS=0
fi

# Create summary report
cat > "$SCAN_OUTPUT_DIR/security-summary.md" << EOF
# Container Security Scan Report

**Generated:** $(date)
**Image:** $IMAGE_NAME
**Scan Threshold:** $SEVERITY_THRESHOLD

## 📊 Summary

### Vulnerability Scan Results
- 🔴 **Critical Vulnerabilities:** $CRITICAL_VULNS
- 🟠 **High Vulnerabilities:** $HIGH_VULNS
- 📁 **Dockerfile Issues:** $dockerfile_issues

### Risk Assessment
$(if [ $CRITICAL_VULNS -gt 0 ] || [ $dockerfile_issues -gt 0 ]; then
    echo "🚨 **HIGH RISK** - Critical issues found that need immediate attention"
elif [ $HIGH_VULNS -gt 0 ]; then
    echo "⚠️ **MEDIUM RISK** - High severity issues should be addressed"
else
    echo "✅ **LOW RISK** - No critical or high severity issues found"
fi)

## 📋 Recommendations

### Immediate Actions Required
$(if [ $CRITICAL_VULNS -gt 0 ]; then
    echo "1. ⚡ **Fix Critical Vulnerabilities** - Update packages/base image"
fi)
$(if [ $dockerfile_issues -gt 0 ]; then
    echo "2. 🔧 **Fix Dockerfile Issues** - Review security best practices"
fi)

### General Recommendations
1. 🔄 **Regular Scanning** - Implement automated security scanning in CI/CD
2. 🔒 **Least Privilege** - Run containers with minimal required permissions
3. 📦 **Minimal Images** - Use distroless or minimal base images
4. 🔐 **Secret Management** - Use external secret management systems
5. 📊 **Monitoring** - Implement runtime security monitoring

## 📁 Detailed Reports
- Vulnerability Details: trivy-vulnerabilities.json
- Configuration Issues: trivy-misconfigurations.json
- Docker Bench Results: docker-bench-report.txt
- Human Readable Report: trivy-report.txt

---
*Generated by Crown Security Scanner v1.0*
EOF

# Display summary
echo ""
echo -e "${BLUE}📊 SECURITY SCAN SUMMARY${NC}"
echo "========================="
echo -e "🔴 Critical Vulnerabilities: ${RED}$CRITICAL_VULNS${NC}"
echo -e "🟠 High Vulnerabilities: ${YELLOW}$HIGH_VULNS${NC}"
echo -e "📁 Dockerfile Issues: ${YELLOW}$dockerfile_issues${NC}"

if [ $CRITICAL_VULNS -gt 0 ] || [ $dockerfile_issues -gt 0 ]; then
    echo ""
    echo -e "${RED}🚨 HIGH RISK DETECTED${NC}"
    echo -e "${RED}Immediate action required before deployment${NC}"
    OVERALL_RESULT=1
elif [ $HIGH_VULNS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️ MEDIUM RISK DETECTED${NC}"
    echo -e "${YELLOW}High severity issues should be addressed${NC}"
    OVERALL_RESULT=1
else
    echo ""
    echo -e "${GREEN}✅ LOW RISK - Security scan passed${NC}"
    OVERALL_RESULT=0
fi

echo ""
echo -e "${BLUE}📁 Reports generated in: $SCAN_OUTPUT_DIR${NC}"
echo -e "${BLUE}📋 Summary report: $SCAN_OUTPUT_DIR/security-summary.md${NC}"

# 5. Optional: Send alerts
if [ "$SEND_ALERTS" = "true" ] && [ $OVERALL_RESULT -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}📧 Sending security alerts...${NC}"
    # TODO: Implement alerting (Slack, email, etc.)
    # ./send-security-alert.sh "$SCAN_OUTPUT_DIR/security-summary.md"
fi

# 6. Cleanup
if [ "$CLEANUP_TEMP" = "true" ]; then
    echo ""
    echo -e "${BLUE}🧹 Cleaning up temporary files...${NC}"
    rm -rf docker-bench-security
fi

echo ""
echo -e "${GREEN}🏁 Container security scan completed${NC}"
echo "======================================"

exit $OVERALL_RESULT
