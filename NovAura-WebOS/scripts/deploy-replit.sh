#!/bin/bash
# Deploy NovAura WebOS to Replit
# Run this in Replit shell after importing from GitHub

echo "🚀 Setting up NovAura WebOS on Replit..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy Replit environment
cp .env.replit .env

# If Replit provides a database URL, use it
if [ -n "$REPLIT_DB_URL" ]; then
  echo "🗄️  Using Replit PostgreSQL..."
  echo "DATABASE_URL=$REPLIT_DB_URL" >> .env
fi

# Build the app
echo "🔨 Building..."
npm run build

# Start the dev server (Replit automatically exposes port 3000)
echo "✅ Starting NovAura WebOS on Replit..."
echo "   Access via: https://www.novaura.life (once domain is configured)"
echo "   Or use the Replit-provided URL"
npm run dev -- --host 0.0.0.0 --port 3000
