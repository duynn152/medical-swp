#!/bin/bash

# Start script for Render deployment

echo "🚀 Starting Medical SWP Backend..."

# Ensure uploads directory exists
mkdir -p uploads/blog-images

# Set default port if not provided
export PORT=${PORT:-8080}

echo "🌐 Server will start on port $PORT"

# Start the application
java -jar target/medical-backend-0.0.1-SNAPSHOT.jar 