#!/bin/bash

# Quick MVP Content Seeder
# Run with: ./scripts/run-quick-mvp.sh

cd "$(dirname "$0")/.."

echo "🚀 Running Quick MVP Content Setup..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Create .env with SUPABASE_URL and SUPABASE_ANON_KEY"
    echo ""
fi

# Run with tsx (faster than ts-node)
if command -v tsx &> /dev/null; then
    echo "Using tsx..."
    tsx scripts/quick-mvp-content.ts
elif command -v ts-node &> /dev/null; then
    echo "Using ts-node..."
    node --loader ts-node/esm scripts/quick-mvp-content.ts
else
    echo "❌ Neither tsx nor ts-node found!"
    echo "   Install one:"
    echo "   npm install -g tsx"
    echo "   or"
    echo "   npm install -g ts-node"
    exit 1
fi
