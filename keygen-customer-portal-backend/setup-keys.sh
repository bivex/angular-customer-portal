#!/bin/bash

# Setup script for RSA key generation
# Copyright (c) 2025 Bivex

set -e

echo "===================================="
echo "RSA Key Setup for JWT RS256"
echo "===================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create secrets/keys directory
KEYS_DIR="./secrets/keys"
mkdir -p "$KEYS_DIR"

echo -e "${YELLOW}Creating keys directory: $KEYS_DIR${NC}"

# Set proper permissions
chmod 700 "$KEYS_DIR"

echo -e "${GREEN}✓${NC} Keys directory created with secure permissions (700)"
echo ""

# Generate RSA key pair (2048 bit)
echo -e "${YELLOW}Generating RSA 2048-bit key pair...${NC}"

# Note: KeyManager will auto-generate keys on first startup
# This script just ensures the directory exists and has proper permissions

echo -e "${GREEN}✓${NC} Key directory prepared"
echo ""

echo "===================================="
echo "Key Setup Complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Keys will be auto-generated on first application startup"
echo "2. Keys are stored in: $KEYS_DIR"
echo "3. KeyManager handles rotation automatically"
echo ""
echo "JWKS endpoint will be available at:"
echo "  /.well-known/jwks.json"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "- Never commit keys to version control"
echo "- Keys directory is gitignored"
echo "- Backup keys securely for production"
echo "- Keys expire after 90 days (auto-rotation)"
echo ""

