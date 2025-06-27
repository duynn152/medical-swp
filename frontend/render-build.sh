#!/bin/bash

# Build script for React frontend on Render

echo "🔧 Starting frontend build process..."

echo "📦 Installing dependencies..."
npm ci

echo "🏗️ Building React application..."
npm run build

echo "✅ Frontend build completed successfully!" 