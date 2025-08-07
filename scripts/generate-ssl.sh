#!/bin/bash

# Generate SSL certificates for development
# This script creates self-signed certificates for Docker development

echo "🔐 Generating SSL certificates for Crown application..."

# Create SSL directory if it doesn't exist
mkdir -p docker/ssl

# Generate private key
openssl genrsa -out docker/ssl/key.pem 2048

# Generate certificate signing request
openssl req -new -key docker/ssl/key.pem -out docker/ssl/csr.pem -subj "/C=VN/ST=HCM/L=Ho Chi Minh/O=Crown/OU=Development/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in docker/ssl/csr.pem -signkey docker/ssl/key.pem -out docker/ssl/cert.pem

# Set proper permissions
chmod 600 docker/ssl/key.pem
chmod 644 docker/ssl/cert.pem

# Clean up
rm docker/ssl/csr.pem

echo "✅ SSL certificates generated successfully!"
echo "   Certificate: docker/ssl/cert.pem"
echo "   Private Key: docker/ssl/key.pem"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only."
echo "   Use proper certificates from a CA for production."
