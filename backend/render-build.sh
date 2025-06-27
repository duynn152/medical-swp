#!/bin/bash

# Build script for Render deployment

echo "🔧 Starting build process..."

# Make mvnw executable
chmod +x mvnw

echo "📦 Installing dependencies and building..."
./mvnw clean package -DskipTests

echo "📁 Creating uploads directory..."
mkdir -p uploads/blog-images

echo "✅ Build completed successfully!" 