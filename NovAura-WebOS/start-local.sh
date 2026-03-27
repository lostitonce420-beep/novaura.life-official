#!/bin/bash

echo "=========================================="
echo "  NovAura WebOS - Local Development"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[1/3] Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}ERROR: npm install failed${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}[1/3] Dependencies already installed ✓${NC}"
fi

echo ""
echo -e "${YELLOW}[2/3] Checking environment...${NC}"

# Check for .env file
if [ ! -f ".env" ]; then
    echo "Creating default .env file..."
    cat > .env << EOF
VITE_BACKEND_URL=http://localhost:8001
VITE_APP_NAME=NovaAura
VITE_APP_VERSION=1.0.0
EOF
    echo -e "${GREEN}.env created with defaults${NC}"
else
    echo -e "${GREEN}.env file exists ✓${NC}"
fi

echo ""
echo -e "${YELLOW}[3/3] Starting development server...${NC}"
echo ""
echo "=========================================="
echo "  Local URLs:"
echo "  - App:    http://localhost:5173"
echo "  - Backend must be running on :8001"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
