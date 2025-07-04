#!/bin/bash

# Medical SWP - Development Starter
# Starts both backend and frontend simultaneously

echo "============================================="
echo "     Medical SWP - Development Mode        "
echo "============================================="
echo

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start backend
start_backend() {
    echo "Starting Backend (Spring Boot)..."
    
    if check_port 8080; then
        echo "⚠️  Port 8080 is already in use. Backend might already be running."
        read -p "Kill existing process and restart? (y/N): " kill_choice
        if [[ $kill_choice =~ ^[Yy]$ ]]; then
            echo "Killing process on port 8080..."
            lsof -ti:8080 | xargs kill -9 2>/dev/null
            sleep 2
        else
            echo "Skipping backend startup..."
            return 0
        fi
    fi
    
    cd backend || {
        echo "❌ Backend directory not found!"
        exit 1
    }
    
    echo "📦 Starting Spring Boot application..."
    echo "🗄️  Using PostgreSQL database on Render.com"
    echo "⏳ This may take a few moments..."
    echo
    
    # Start backend in background
    mvn spring-boot:run > ../backend.log 2>&1 &
    BACKEND_PID=$!
    
    echo "Backend PID: $BACKEND_PID"
    echo "Backend logs: backend.log"
    
    # Wait a bit and check if backend started successfully
    sleep 5
    if ps -p $BACKEND_PID > /dev/null; then
        echo "✅ Backend started successfully!"
    else
        echo "❌ Backend failed to start. Check backend.log for details."
        return 1
    fi
    
    cd ..
}

# Function to start frontend
start_frontend() {
    echo
    echo "Starting Frontend (React + Vite)..."
    
    if check_port 5173; then
        echo "⚠️  Port 5173 is already in use. Frontend might already be running."
        read -p "Kill existing process and restart? (y/N): " kill_choice
        if [[ $kill_choice =~ ^[Yy]$ ]]; then
            echo "Killing process on port 5173..."
            lsof -ti:5173 | xargs kill -9 2>/dev/null
            sleep 2
        else
            echo "Skipping frontend startup..."
            return 0
        fi
    fi
    
    cd frontend || {
        echo "❌ Frontend directory not found!"
        exit 1
    }
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install dependencies!"
            exit 1
        fi
    fi
    
    echo "🚀 Starting Vite development server..."
    echo
    
    # Start frontend in background
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    echo "Frontend PID: $FRONTEND_PID"
    echo "Frontend logs: frontend.log"
    
    # Wait a bit and check if frontend started successfully
    sleep 3
    if ps -p $FRONTEND_PID > /dev/null; then
        echo "✅ Frontend started successfully!"
    else
        echo "❌ Frontend failed to start. Check frontend.log for details."
        return 1
    fi
    
    cd ..
}

# Function to wait for services to be ready
wait_for_services() {
    echo
    echo "⏳ Waiting for services to be ready..."
    
    # Wait for backend
    echo -n "Backend (port 8080): "
    for i in {1..30}; do
        if curl -s http://localhost:8080/api/actuator/health > /dev/null 2>&1; then
            echo "✅ Ready!"
            break
        else
            echo -n "."
            sleep 2
        fi
        
        if [ $i -eq 30 ]; then
            echo "❌ Timeout!"
            echo "Backend is taking too long to start. Check backend.log"
        fi
    done
    
    # Wait for Swagger UI
    echo -n "Swagger UI: "
    for i in {1..15}; do
        if curl -s http://localhost:8080/api/v3/api-docs > /dev/null 2>&1; then
            echo "✅ Ready!"
            break
        else
            echo -n "."
            sleep 1
        fi
        
        if [ $i -eq 15 ]; then
            echo "❌ Timeout!"
            echo "Swagger is taking too long to initialize."
        fi
    done
    
    # Wait for frontend
    echo -n "Frontend (port 5173): "
    for i in {1..15}; do
        if curl -s http://localhost:5173 > /dev/null 2>&1; then
            echo "✅ Ready!"
            break
        else
            echo -n "."
            sleep 2
        fi
        
        if [ $i -eq 15 ]; then
            echo "❌ Timeout!"
            echo "Frontend is taking too long to start. Check frontend.log"
        fi
    done
}

# Function to show running services info
show_services_info() {
    echo
    echo "============================================="
    echo "🎉 Medical SWP Development Environment Ready!"
    echo "============================================="
    echo
    echo "🌐 Application URLs:"
    echo "📱 Frontend:     http://localhost:5173"
    echo "🔧 Backend API:  http://localhost:8080/api"
    echo "📖 Swagger UI:   http://localhost:8080/api/swagger-ui.html"
    echo "📋 API Docs:     http://localhost:8080/api/v3/api-docs"
    echo "📊 Health Check: http://localhost:8080/api/actuator/health"
    echo
    echo "🔍 API Testing:"
    echo "   • Browse & Test APIs: http://localhost:8080/api/"
    echo "   • Use 'Authorize' button in Swagger for JWT token"
    echo "   • Login endpoint: POST /auth/login"
    echo
    echo "📁 Log Files:"
    echo "   Backend:  backend.log"
    echo "   Frontend: frontend.log"
    echo
    echo "🛑 Stop Services:"
    echo "   Press Ctrl+C or run: ./scripts/stop-dev.sh"
    echo
    echo "🔧 Database Management:"
    echo "   Run: ./scripts/database-manager.sh"
    echo
    echo "🚀 Quick Start Guide:"
    echo "   1. Open browser: http://localhost:8080/api/"
    echo "   2. Try public endpoints (no auth required):"
    echo "      • POST /appointments/public - Create appointment"
    echo "      • GET /appointments/public/availability - Check time slots"
    echo "   3. For protected endpoints:"
    echo "      • Use /auth/login to get JWT token"
    echo "      • Click 'Authorize' in Swagger UI"
    echo "      • Enter: Bearer <your-jwt-token>"
    echo
}

# Function to handle cleanup on exit
cleanup() {
    echo
    echo "🛑 Stopping development services..."
    
    if [ ! -z "$BACKEND_PID" ] && ps -p $BACKEND_PID > /dev/null; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    fi
    
    if [ ! -z "$FRONTEND_PID" ] && ps -p $FRONTEND_PID > /dev/null; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    fi
    
    # Also kill any remaining processes on the ports
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    
    echo "✅ Development services stopped"
    exit 0
}

# Main execution
main() {
    # Check dependencies
    if ! command -v mvn &> /dev/null; then
        echo "❌ Maven is not installed. Please install Maven first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    # Set up signal handling for cleanup
    trap cleanup SIGINT SIGTERM
    
    # Start services
    start_backend
    start_frontend
    wait_for_services
    show_services_info
    
    # Keep script running and monitor services
    echo "📊 Monitoring services... (Press Ctrl+C to stop)"
    echo
    
    while true; do
        sleep 10
        
        # Check if services are still running
        if [ ! -z "$BACKEND_PID" ] && ! ps -p $BACKEND_PID > /dev/null; then
            echo "⚠️  Backend process died. Check backend.log"
        fi
        
        if [ ! -z "$FRONTEND_PID" ] && ! ps -p $FRONTEND_PID > /dev/null; then
            echo "⚠️  Frontend process died. Check frontend.log"
        fi
    done
}

# Run main function
main 