 #!/usr/bin/env bash
 set -euo pipefail

# Land Registry System - Development Startup Script
# For Linux/Mac systems

echo "🏛️ Starting Land Registry System Development Environment..."
echo ""
echo "Port Configuration:"
echo "- Land Officer Frontend: http://localhost:3000"
echo "- User Frontend:         http://localhost:3002"
echo "- Unified Backend:       https://land-registry-backend-plum.vercel.app"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ and try again."
    exit 1
fi

# Note: MongoDB is now handled by the unified backend
echo "ℹ️  Database is managed by the unified backend at:"
echo "   https://land-registry-backend-plum.vercel.app"
echo ""

# Function to check if dependencies are installed
check_dependencies() {
    local dir=$1
    if [ ! -d "$dir/node_modules" ]; then
        echo "📦 Installing dependencies for $dir..."
        cd "$dir" && npm install
        cd ..
    fi
}

# Check and install dependencies
echo "🔍 Checking dependencies..."
check_dependencies "landofficer"
check_dependencies "user"

# Function to start application in background
start_app() {
    local app_name=$1
    local app_dir=$2
    
    echo "🚀 Starting $app_name..."
    
    # Start the application in a new terminal window/tab
    if command -v gnome-terminal &> /dev/null; then
        # Linux with GNOME Terminal
        gnome-terminal --tab --title="$app_name" -- bash -c "cd $app_dir && npm run dev; exec bash"
    elif command -v xterm &> /dev/null; then
        # Linux with xterm
        xterm -T "$app_name" -e "cd $app_dir && npm run dev; bash" &
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e "tell application \"Terminal\" to do script \"cd $(pwd)/$app_dir && npm run dev\""
    else
        # Fallback: start in background
        echo "⚠️  Could not open new terminal. Starting $app_name in background..."
PIDS=()
start_app() {
   ...
    cd "$app_dir" && npm run dev &
    PIDS+=($!)
   ...
 }
 
 # Start applications
 start_app "Land Officer Application" "landofficer"
 start_app "User Application" "user"
 
# Cleanup on exit
cleanup() {
  echo "🛑 Stopping applications..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  exit 0
}
trap cleanup INT TERM

 # Simple wait loop
 while true; do
     sleep 30
 done
echo ""
echo "📋 Application URLs:"
echo "   🏛️  Land Officer Portal: http://localhost:3000"
echo "   👥 User Portal:          http://localhost:3002"
echo "   🔗 Unified Backend:      https://land-registry-backend-plum.vercel.app"
echo ""
echo "⚠️  Note: If applications don't start automatically, check the opened terminal windows."
echo "   You can also start them manually:"
echo "   - Land Officer: cd landofficer && npm run dev"
echo "   - User Portal:  cd user && npm run dev"
echo ""
echo "🛑 To stop all services, close the terminal windows or press Ctrl+C in each."
echo ""

# Keep the script running
echo "🔄 Applications started. Press Ctrl+C to exit this monitor."
echo ""

# Simple wait loop
while true; do
    sleep 30
done
