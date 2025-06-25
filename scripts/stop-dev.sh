#!/bin/bash

# Medical SWP - Stop Development Services
# Stops all running development services

echo "============================================="
echo "   Medical SWP - Stopping Dev Services     "
echo "============================================="
echo

# Function to stop process on port
stop_port() {
    local port=$1
    local service_name=$2
    
    echo "Checking port $port ($service_name)..."
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo "🛑 Stopping $service_name on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 1
        
        # Check if stopped successfully
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            echo "✅ $service_name stopped successfully"
        else
            echo "⚠️  Failed to stop $service_name"
        fi
    else
        echo "✅ $service_name is not running"
    fi
}

# Function to clean up log files
cleanup_logs() {
    echo
    echo "🧹 Cleaning up log files..."
    
    if [ -f "backend.log" ]; then
        rm backend.log
        echo "✅ Removed backend.log"
    fi
    
    if [ -f "frontend.log" ]; then
        rm frontend.log
        echo "✅ Removed frontend.log"
    fi
}

# Main execution
main() {
    # Stop services
    stop_port 8080 "Backend (Spring Boot)"
    stop_port 5173 "Frontend (Vite)"
    
    # Clean up logs
    cleanup_logs
    
    echo
    echo "✅ All development services stopped"
    echo "🚀 To start again, run: ./scripts/start-dev.sh"
}

# Run main function
main 