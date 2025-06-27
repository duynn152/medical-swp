#!/bin/bash

# Build script for Render deployment (using Maven directly)

echo "🔧 Starting build process..."

echo "📦 Installing dependencies and building with Maven..."
mvn clean package -DskipTests -B

echo "📁 Creating uploads directory..."
mkdir -p uploads/blog-images

echo "✅ Build completed successfully!" 