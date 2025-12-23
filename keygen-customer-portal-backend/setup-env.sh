#!/bin/bash

# Secure Environment Setup Script
# This script helps set up environment variables securely
# WARNING: Never commit .env files to version control!

set -e

echo "🔐 Setting up secure environment variables..."
echo "⚠️  WARNING: .env files contain sensitive secrets and should NEVER be committed to version control!"
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Validate that we're not in a git repository with .env committed
if [ -d ".git" ] && git ls-files .env >/dev/null 2>&1; then
    echo "❌ ERROR: .env file is tracked by git! This is a security risk."
    echo "   Please remove it from git tracking: git rm --cached .env"
    echo "   And ensure .env is in .gitignore"
    exit 1
fi

# Generate secure JWT secret
echo "Generating secure JWT secret..."
JWT_SECRET=$(openssl rand -base64 32)

# Generate secure database password (if using local database)
echo "Generating secure database password..."
DB_PASSWORD=$(openssl rand -base64 16)

# Get database URL
read -p "Enter PostgreSQL connection string (or press Enter for local setup): " DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    DATABASE_URL="postgresql://postgres:$DB_PASSWORD@localhost:5432/keygen_portal"
    echo "Using local PostgreSQL setup: $DATABASE_URL"
fi

# Get other configuration
read -p "Enter host (default: localhost): " HOST
HOST=${HOST:-localhost}

read -p "Enter port (default: 3000): " PORT
PORT=${PORT:-3000}

read -p "Enter Sentry DSN (optional): " SENTRY_DSN

# Create .env file with secure defaults
cat > .env << EOF
# ==========================================
# 🔐 SECURE ENVIRONMENT CONFIGURATION
# ==========================================
# ⚠️  WARNING: This file contains SENSITIVE SECRETS!
#    NEVER commit this file to version control!
#    Use .gitignore to ensure it's excluded.
#
# For production, use a secrets management service:
#   - AWS Secrets Manager, Azure Key Vault, GCP Secret Manager
#   - HashiCorp Vault, Doppler, Infisical
#   - Docker secrets, Kubernetes secrets
# ==========================================

# Database Configuration (REQUIRED)
DATABASE_URL=$DATABASE_URL

# JWT Configuration (REQUIRED - must be 32+ characters)
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# Server Configuration
HOST=$HOST
PORT=$PORT
NODE_ENV=development

# Monitoring (Optional - leave empty if not using)
SENTRY_DSN=$SENTRY_DSN

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ==========================================
# SECURITY CHECKLIST:
# ✅ .env is in .gitignore
# ✅ Secrets are randomly generated
# ✅ File permissions are restrictive (600)
# ✅ No hardcoded secrets in code
# ✅ Use secrets management in production
# ==========================================
EOF

# Set proper permissions
chmod 600 .env

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "🔑 Generated secrets:"
echo "   JWT Secret: $(echo $JWT_SECRET | cut -c1-20)..."
echo "   DB Password: $(echo $DB_PASSWORD | cut -c1-20)..."
echo ""
echo "📝 Next steps:"
echo "   1. Review and customize the .env file"
echo "   2. Set up your PostgreSQL database"
echo "   3. Run 'bun run db:migrate' to initialize the database"
echo "   4. Start the server with 'bun run dev'"
echo ""
echo "🔒 Security recommendations:"
echo "   - Store production secrets in a secure vault"
echo "   - Rotate secrets regularly"
echo "   - Use different secrets for each environment"
echo "   - Monitor for secret leakage"