#!/usr/bin/env bash

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting OpenEvolve Fullstack Application${NC}"

# Start backend API server
echo -e "${YELLOW}Starting backend API server...${NC}"
cd /Users/jarvis/Desktop/openevolve
python -m openevolve.api > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait a moment for backend to start
sleep 5

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}Backend server started successfully${NC}"
else
    echo -e "${RED}Failed to start backend server${NC}"
    exit 1
fi

# Start frontend
echo -e "${YELLOW}Starting frontend...${NC}"
cd /Users/jarvis/Desktop/openevolve/alpha_frontend
NEXT_PUBLIC_API_BASE=http://localhost:8000 npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait a moment for frontend to start
sleep 10

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}Frontend server started successfully${NC}"
else
    echo -e "${RED}Failed to start frontend server${NC}"
    # Kill backend if frontend failed to start
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}OpenEvolve Fullstack Application is running!${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}Backend API: http://localhost:8000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"

# Function to clean up processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}Services stopped${NC}"
    exit 0
}

# Trap exit signals
trap cleanup EXIT INT TERM

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID