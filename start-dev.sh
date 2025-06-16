 #!/usr/bin/env bash
 set -euo pipefail

# Federal Land Administration System - Development Startup Script
# For Linux/Mac systems

echo "🏛️ Starting Federal Land Administration System Development Environment..."
echo ""
echo "Port Configuration:"
echo "- Land Officer Frontend: http://localhost:3000"
echo "- Land Officer Server:   http://localhost:3001"
echo "- User Frontend:         http://localhost:3002"
echo "- User Server:           http://localhost:3003"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ and try again."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Attempting to start..."
    
    # Try different methods to start MongoDB
    if command -v brew &> /dev/null; then
        # macOS with Homebrew
        brew services start mongodb-community
    elif command -v systemctl &> /dev/null; then
        # Linux with systemd
        sudo systemctl start mongod
    else
        echo "❌ Could not start MongoDB automatically. Please start MongoDB manually and try again."
        exit 1
    fi
    
    # Wait a moment for MongoDB to start
    sleep 3
fi

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
        cd "$app_dir" && npm run dev &
        cd ..
    fi
    
    # Wait a moment before starting the next application
    sleep 3
}

# Start applications
start_app "Land Officer Application" "landofficer"
start_app "User Application" "user"

echo ""
echo "✅ Both applications are starting..."
echo ""
echo "📋 Application URLs:"
echo "   🏛️  Land Officer Portal: http://localhost:3000"
echo "   👥 User Portal:          http://localhost:3002"
echo ""
echo "📚 Documentation:"
echo "   📖 Main Documentation:   docs/README.md"
echo "   🚀 Deployment Guide:     docs/deployment.md"
echo "   🔧 Troubleshooting:      docs/troubleshooting/common-issues.md"
echo ""
echo "🔑 Default Admin Login:"
echo "   📧 Email:    admin@system.com"
echo "   🔒 Password: admin123"
echo ""
echo "⚠️  Note: If applications don't start automatically, check the opened terminal windows."
echo "   You can also start them manually:"
echo "   - Land Officer: cd landofficer && npm run dev"
echo "   - User Portal:  cd user && npm run dev"
echo ""
echo "🛑 To stop all services, close the terminal windows or press Ctrl+C in each."
echo ""
echo "📞 Need help? Check docs/troubleshooting/common-issues.md or contact support."
echo ""

# Keep the script running to show status
echo "🔄 Monitoring applications... (Press Ctrl+C to exit this monitor)"
echo ""

# Function to check if applications are running
check_status() {
    local port=$1
    local name=$2
    
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        echo "✅ $name is running on port $port"
    else
        echo "❌ $name is not responding on port $port"
    fi
}

# Monitor applications every 30 seconds
while true; do
    sleep 30
    echo "$(date): Checking application status..."
    check_status 3000 "Land Officer Frontend"
    check_status 3001 "Land Officer Server"
    check_status 3002 "User Frontend"
    check_status 3003 "User Server"
    echo ""
done
