#!/bin/bash

# Keygen Customer Portal Development Server Manager
# Usage: ./dev-server.sh [backend|hardkill|start|stop|restart|status|logs|clean|live|console|build]
#
# Package Managers:
#   Backend:  bun (runs 'bun run dev')
#   Frontend: pnpm (runs 'pnpm start')
#
# Port Logic:
# - Backend and frontend cannot use the same port
# - Ports are validated to ensure they're within 1-65535 range

# =============================================================================
# CONFIGURATION - Easy to modify settings
# =============================================================================

# Directory paths (relative to script location)
BACKEND_DIR="./keygen-customer-portal-backend"
FRONTEND_DIR="./keygen-customer-portal-frontend"

# Server ports (can be overridden via environment variables BACKEND_PORT/FRONTEND_PORT)
BACKEND_PORT=${BACKEND_PORT:-3000}
FRONTEND_PORT=${FRONTEND_PORT:-4200}

# =============================================================================
# END CONFIGURATION
# =============================================================================

set -e


# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kill all frontend processes on common ports
kill_all_frontend_ports() {
    log_info "Cleaning up all frontend processes on common ports..."

    # Common frontend ports to clean
    local frontend_ports=(4200 4201 4202 4203 4204 4205 8081 3001 5173 5174 8080)

    for port in "${frontend_ports[@]}"; do
        if check_port $port; then
            local pid=$(get_pid $port)
            if [ -n "$pid" ]; then
                log_info "Killing frontend process on port $port (PID: $pid)..."
                kill -9 $pid 2>/dev/null || true
            fi
        fi
    done

    # Also kill any remaining Angular/node processes
    local node_pids=$(pgrep -f "ng serve\|pnpm start\|npm start" 2>/dev/null || echo "")
    if [ -n "$node_pids" ]; then
        log_info "Force killing remaining Angular/Node dev processes..."
        echo "$node_pids" | xargs kill -9 2>/dev/null || true
    fi

    # Wait a moment for ports to be freed
    sleep 1
    log_success "Frontend ports cleaned up"
}

# Find running services on different ports
find_running_services() {
    log_info "Searching for already running services..."

    # Check if backend is running on configured port
    if check_port $BACKEND_PORT; then
        log_info "Backend found on configured port $BACKEND_PORT"
    else
        # Try to find backend on common ports
        for port in 3000 3001 8080 8000; do
            if check_port $port && curl -s http://localhost:$port/health >/dev/null 2>&1; then
                log_warning "Backend found on port $port (configured for $BACKEND_PORT)"
                BACKEND_PORT=$port
                break
            fi
        done
    fi

    # Check if frontend is running on configured port
    if check_port $FRONTEND_PORT; then
        log_info "Frontend found on configured port $FRONTEND_PORT"
    else
        # Try to find frontend on common ports
        for port in 4200 4201 4202 8081 3001; do
            if check_port $port && curl -s http://localhost:$port >/dev/null 2>&1; then
                log_warning "Frontend found on port $port (configured for $FRONTEND_PORT)"
                FRONTEND_PORT=$port
                break
            fi
        done
    fi
}

# Validate environment
validate_environment() {
    # Check if required directories exist
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi

    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi

    # Check if required tools are available
    if ! command -v bun >/dev/null 2>&1; then
        log_error "bun is not installed or not in PATH (required for backend)"
        exit 1
    fi
    if ! command -v pnpm >/dev/null 2>&1; then
        log_error "pnpm is not installed or not in PATH (required for frontend)"
        exit 1
    fi

    # Check if ports are valid numbers
    if ! [[ "$BACKEND_PORT" =~ ^[0-9]+$ ]] || [ "$BACKEND_PORT" -lt 1 ] || [ "$BACKEND_PORT" -gt 65535 ]; then
        log_error "Invalid backend port: $BACKEND_PORT (must be 1-65535)"
        exit 1
    fi

    if ! [[ "$FRONTEND_PORT" =~ ^[0-9]+$ ]] || [ "$FRONTEND_PORT" -lt 1 ] || [ "$FRONTEND_PORT" -gt 65535 ]; then
        log_error "Invalid frontend port: $FRONTEND_PORT (must be 1-65535)"
        exit 1
    fi

    if [ "$BACKEND_PORT" = "$FRONTEND_PORT" ]; then
        log_error "Backend and frontend ports cannot be the same: $BACKEND_PORT"
        exit 1
    fi
}

# Check if a port is in use
check_port() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 0
        fi
    else
        # Fallback to netstat if lsof is not available
        if command -v netstat >/dev/null 2>&1; then
            if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                return 0
            fi
        else
            # Last resort: try to connect to the port
            if timeout 1 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null; then
                return 0
            fi
        fi
    fi
    return 1
}

# Get process ID for a port
get_pid() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti:$port 2>/dev/null || echo ""
    else
        # Fallback method using ps and netstat
        local pid=""
        if command -v netstat >/dev/null 2>&1; then
            pid=$(netstat -tuln 2>/dev/null | grep ":$port " | head -1 | awk '{print $NF}' | cut -d'/' -f1)
        fi
        echo "$pid"
    fi
}

# Start backend service
start_backend() {
    log_info "Starting backend service on port $BACKEND_PORT..."

    # Check if backend is already running and healthy
    if check_port $BACKEND_PORT && curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
        local existing_pid=$(get_pid $BACKEND_PORT)
        log_success "Backend already running and healthy on port $BACKEND_PORT (PID: $existing_pid)"
        echo $existing_pid > ../backend.pid
        return 0
    fi

    # Kill existing backend if running on wrong port or unhealthy
    if check_port $BACKEND_PORT; then
        local existing_pid=$(get_pid $BACKEND_PORT)
        log_warning "Backend running but unhealthy on port $BACKEND_PORT (PID: $existing_pid), stopping it first..."
        kill $existing_pid 2>/dev/null || true
        # sleep 2
        if check_port $BACKEND_PORT; then
            kill -9 $existing_pid 2>/dev/null || true
            # sleep 1
        fi
    fi

    cd "$BACKEND_DIR" 2>/dev/null || {
        log_error "Backend directory not found: $BACKEND_DIR"
        return 1
    }

    log_info "Running 'PORT=$BACKEND_PORT bun run dev' in $BACKEND_DIR..."

    # Check if bun is available
    if ! command -v bun >/dev/null 2>&1; then
        log_error "bun command not found. Please install bun first."
        cd ..
        return 1
    fi

    PORT=$BACKEND_PORT bun run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!

    # Give it a moment to start and check if process is still alive
    sleep 2
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        log_error "Backend process died immediately after starting"
        log_error "=== Backend startup diagnostics ==="
        if [ -f "../backend.log" ]; then
            log_error "Backend log content:"
            cat ../backend.log | while IFS= read -r line; do
                log_error "  $line"
            done
        fi
        log_error "=== End diagnostics ==="
        cd ..
        return 1
    fi

    # Wait for backend to start (reasonable timeout for compilation and initialization)
    local attempts=0
    local max_attempts=300
    while ! check_port $BACKEND_PORT && [ $attempts -lt $max_attempts ]; do
        # sleep 1
        ((attempts++))
        if [ $((attempts % 3)) -eq 0 ]; then
            log_info "Waiting for backend to start... ($attempts/$max_attempts)"
        fi
    done

    if check_port $BACKEND_PORT; then
        log_success "Backend started successfully on port $BACKEND_PORT (PID: $BACKEND_PID)"
        echo $BACKEND_PID > ../backend.pid
        cd ..
        return 0
    else
        log_error "Backend failed to start within $max_attempts seconds"
        log_error "=== Backend startup diagnostics ==="
        if [ -f "../backend.log" ]; then
            log_error "Last 10 lines from backend.log:"
            tail -10 ../backend.log | while IFS= read -r line; do
                log_error "  $line"
            done
        else
            log_error "No backend.log file found - check if bun is installed and backend directory exists"
        fi
        log_error "=== End diagnostics ==="
        kill $BACKEND_PID 2>/dev/null || true
        cd ..
        return 1
    fi
}

# Build frontend for production
build_frontend() {
    log_info "Building frontend for production..."

    cd "$FRONTEND_DIR" 2>/dev/null || {
        log_error "Frontend directory not found: $FRONTEND_DIR"
        return 1
    }

    log_info "Running 'pnpm build' in $FRONTEND_DIR..."
    if pnpm build; then
        log_success "Frontend built successfully"
        cd ..
        return 0
    else
        log_error "Frontend build failed"
        cd ..
        return 1
    fi
}

# Start frontend service
start_frontend() {
    log_info "Starting frontend service on port $FRONTEND_PORT..."

    # Clean up all frontend ports first
    kill_all_frontend_ports

    # Check if frontend is already running and accessible on the target port
    if check_port $FRONTEND_PORT && curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
        local existing_pid=$(get_pid $FRONTEND_PORT)
        log_success "Frontend already running and accessible on port $FRONTEND_PORT (PID: $existing_pid)"
        echo $existing_pid > ../frontend.pid
        return 0
    fi

    # Change to the script's directory first, then to frontend directory
    cd "$(dirname "$0")" 2>/dev/null || {
        log_error "Cannot change to script directory"
        return 1
    }

    cd "$FRONTEND_DIR" 2>/dev/null || {
        log_error "Frontend directory not found: $FRONTEND_DIR"
        return 1
    }

    log_info "Running 'ng serve --host 127.0.0.1 --port $FRONTEND_PORT' in $FRONTEND_DIR..."
    ng serve --host 127.0.0.1 --port $FRONTEND_PORT > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid

    # Wait for frontend to start
    local attempts=0
    local max_attempts=300
    while ! check_port $FRONTEND_PORT && [ $attempts -lt $max_attempts ]; do
        sleep 1
        ((attempts++))
        if [ $((attempts % 5)) -eq 0 ]; then
            log_info "Waiting for frontend to start... ($attempts/$max_attempts)"
        fi
    done

    if check_port $FRONTEND_PORT; then
        log_success "Frontend started successfully on port $FRONTEND_PORT (PID: $FRONTEND_PID)"
        cd ..
        return 0
    else
        log_error "Frontend failed to start within $max_attempts seconds"
        kill $FRONTEND_PID 2>/dev/null || true
        cd ..
        return 1
    fi
}

# Stop backend service
stop_backend() {
    if [ -f "backend.pid" ]; then
        local pid=$(cat backend.pid)
        if kill -0 $pid 2>/dev/null; then
            log_info "Stopping backend service (PID: $pid)..."
            kill $pid
            # Wait for process to stop
            local attempts=0
            while kill -0 $pid 2>/dev/null && [ $attempts -lt 10 ]; do
                # sleep 1
                ((attempts++))
            done
            if kill -0 $pid 2>/dev/null; then
                log_warning "Backend didn't stop gracefully, force killing..."
                kill -9 $pid 2>/dev/null || true
            fi
        fi
        rm -f backend.pid
        log_success "Backend stopped"
    else
        log_warning "Backend PID file not found, checking port $BACKEND_PORT..."
        local pid=$(get_pid $BACKEND_PORT)
        if [ -n "$pid" ]; then
            log_info "Stopping backend service on port $BACKEND_PORT (PID: $pid)..."
            kill $pid
            # sleep 2
            if check_port $BACKEND_PORT; then
                kill -9 $pid 2>/dev/null || true
            fi
            log_success "Backend stopped"
        else
            log_info "Backend is not running"
        fi
    fi
}

# Hard kill backend service - force kill any processes on backend port
hardkill_backend() {
    log_info "Force killing any backend processes on port $BACKEND_PORT..."

    # Kill any processes found on the backend port
    local pid=$(get_pid $BACKEND_PORT)
    if [ -n "$pid" ]; then
        log_info "Force killing backend process (PID: $pid)..."
        kill -9 $pid 2>/dev/null || true
        log_success "Backend process force killed"
    else
        log_info "No backend processes found on port $BACKEND_PORT"
    fi

    # Clean up PID file
    rm -f backend.pid

    # Also kill any remaining bun processes that might be related to backend
    local bun_pids=$(pgrep -f "bun run dev" 2>/dev/null || echo "")
    if [ -n "$bun_pids" ]; then
        log_info "Force killing remaining bun dev processes..."
        echo "$bun_pids" | xargs kill -9 2>/dev/null || true
    fi
}

# Stop frontend service
stop_frontend() {
    if [ -f "frontend.pid" ]; then
        local pid=$(cat frontend.pid)
        if kill -0 $pid 2>/dev/null; then
            log_info "Stopping Angular dev server (PID: $pid)..."
            kill $pid
            # Wait for process to stop
            local attempts=0
            while kill -0 $pid 2>/dev/null && [ $attempts -lt 10 ]; do
                sleep 1
                ((attempts++))
            done
            if kill -0 $pid 2>/dev/null; then
                log_warning "Angular dev server didn't stop gracefully, force killing..."
                kill -9 $pid 2>/dev/null || true
            fi
        fi
        rm -f frontend.pid
        log_success "Angular dev server stopped"
    else
        log_warning "Frontend PID file not found, checking port 4201..."
        local pid=$(get_pid 4201)
        if [ -n "$pid" ]; then
            log_info "Stopping Angular dev server on port 4201 (PID: $pid)..."
            kill $pid
            sleep 2
            if check_port 4201; then
                kill -9 $pid 2>/dev/null || true
            fi
            log_success "Angular dev server stopped"
        fi

        # Also check the main frontend port for any remaining processes
        local main_pid=$(get_pid $FRONTEND_PORT)
        if [ -n "$main_pid" ]; then
            log_info "Stopping any remaining processes on port $FRONTEND_PORT (PID: $main_pid)..."
            kill $main_pid
            sleep 2
            if check_port $FRONTEND_PORT; then
                kill -9 $main_pid 2>/dev/null || true
            fi
        fi
    fi
}

# Show status of services
show_status() {
    echo "=== Service Status ==="
    echo "Backend Port:  $BACKEND_PORT"
    echo "Frontend Port: $FRONTEND_PORT"
    echo ""

    # Backend status
    if check_port $BACKEND_PORT; then
        local pid=$(get_pid $BACKEND_PORT)
        echo -e "Backend:    ${GREEN}RUNNING${NC} (PID: $pid)"
    else
        echo -e "Backend:    ${RED}STOPPED${NC}"
    fi

    # Frontend status
    if check_port $FRONTEND_PORT; then
        local pid=$(get_pid $FRONTEND_PORT)
        echo -e "Frontend:   ${GREEN}RUNNING${NC} (PID: $pid)"
    else
        echo -e "Frontend:   ${RED}STOPPED${NC}"
    fi

    echo ""
    echo "=== URLs ==="
    echo "Backend:  http://localhost:$BACKEND_PORT"
    echo "Frontend: http://localhost:$FRONTEND_PORT"
}

# Clean up log files
cleanup_logs() {
    rm -f backend.log frontend.log backend.pid frontend.pid
    log_info "Cleaned up log files and PID files"
}

# Live monitoring mode - keeps services running and restarts them if they crash
live_monitoring() {
    log_info "Starting live monitoring mode..."
    log_info "Services will be automatically restarted if they crash"
    log_info "Press Ctrl+C to stop monitoring"

    # Start services initially
    if ! start_backend || ! start_frontend; then
        log_error "Failed to start initial services"
        exit 1
    fi

    # Set up signal handler for clean exit
    trap 'log_info "Stopping live monitoring..."; stop_backend; stop_frontend; exit 0' INT TERM

    # Monitoring loop
    while true; do
        # Check backend
        if ! check_port $BACKEND_PORT; then
            log_warning "Backend crashed or stopped, restarting..."
            if ! start_backend; then
                log_error "Failed to restart backend, will retry in 5 seconds..."
                # sleep 5
                continue
            fi
        fi

        # Check frontend
        if ! check_port $FRONTEND_PORT; then
            log_warning "Frontend crashed or stopped, restarting..."
            if ! start_frontend; then
                log_error "Failed to restart frontend, will retry in 5 seconds..."
                # sleep 5
                continue
            fi
        fi

        # Brief status update every 30 seconds
        if [ $((SECONDS % 30)) -eq 0 ]; then
            local backend_status="DOWN"
            local frontend_status="DOWN"
            check_port $BACKEND_PORT && backend_status="UP"
            check_port $FRONTEND_PORT && frontend_status="UP"
            log_info "Services status - Backend: $backend_status, Frontend: $frontend_status"
        fi

        sleep 5
    done
}

# Live console monitoring - shows real-time status and logs
live_console() {
    log_info "Starting live monitoring console..."
    log_info "Press Ctrl+C to exit console"
    echo ""
    echo "┌─────────────────────────────────────────────────────────────┐"
    echo "│           Keygen Customer Portal - Live Console             │"
    echo "├─────────────────────────────────────────────────────────────┤"
    echo "│ Backend:  http://localhost:$BACKEND_PORT (Port $BACKEND_PORT)    │"
    echo "│ Frontend: http://localhost:$FRONTEND_PORT (Port $FRONTEND_PORT)   │"
    echo "├─────────────────────────────────────────────────────────────┤"
    echo "│ Status: Checking...                                         │"
    echo "│ Last Update: $(date '+%H:%M:%S')                           │"
    echo "└─────────────────────────────────────────────────────────────┘"
    echo ""

    # Set up signal handler for clean exit
    trap 'echo ""; log_info "Exiting live console..."; exit 0' INT TERM

    local last_backend_pid=""
    local last_frontend_pid=""
    local last_backend_status="UNKNOWN"
    local last_frontend_status="UNKNOWN"

    while true; do
        # Get current status
        local backend_running="DOWN"
        local frontend_running="DOWN"
        local backend_pid=""
        local frontend_pid=""

        if check_port $BACKEND_PORT; then
            backend_running="UP"
            backend_pid=$(get_pid $BACKEND_PORT)
        fi

        if check_port $FRONTEND_PORT; then
            frontend_running="UP"
            frontend_pid=$(get_pid $FRONTEND_PORT)
        fi

        # Clear screen and redraw (only if status changed or every 10 seconds)
        if [ "$backend_running" != "$last_backend_status" ] || [ "$frontend_running" != "$last_frontend_status" ] || [ "$backend_pid" != "$last_backend_pid" ] || [ "$frontend_pid" != "$last_frontend_pid" ] || [ $((SECONDS % 10)) -eq 0 ]; then
            clear
            echo "┌─────────────────────────────────────────────────────────────┐"
            echo "│           Keygen Customer Portal - Live Console             │"
            echo "├─────────────────────────────────────────────────────────────┤"
            printf "│ Backend:  %-12s │ Frontend: %-12s │\n" "$backend_running" "$frontend_running"
            printf "│ Port %-5s │ Port %-5s │ Uptime: %8s │\n" "$BACKEND_PORT" "$FRONTEND_PORT" "$(uptime | awk '{print $1}')"
            echo "├─────────────────────────────────────────────────────────────┤"

            # Show recent log entries
            echo "│ Recent Backend Logs:                                       │"
            if [ -f "backend.log" ]; then
                tail -3 backend.log 2>/dev/null | while read -r line; do
                    printf "│ %-57s │\n" "$(echo "$line" | cut -c1-57)"
                done
            else
                echo "│  No logs available                                       │"
            fi

            echo "├─────────────────────────────────────────────────────────────┤"
            echo "│ Recent Frontend Logs:                                      │"
            if [ -f "frontend.log" ]; then
                tail -3 frontend.log 2>/dev/null | while read -r line; do
                    printf "│ %-57s │\n" "$(echo "$line" | cut -c1-57)"
                done
            else
                echo "│  No logs available                                       │"
            fi

            echo "├─────────────────────────────────────────────────────────────┤"
            printf "│ Last Update: %-45s │\n" "$(date '+%Y-%m-%d %H:%M:%S')"
            echo "│ Press Ctrl+C to exit                                      │"
            echo "└─────────────────────────────────────────────────────────────┘"

            last_backend_status="$backend_running"
            last_frontend_status="$frontend_running"
            last_backend_pid="$backend_pid"
            last_frontend_pid="$frontend_pid"
        fi

        # sleep 2
    done
}

# Run validation
validate_environment

# Find running services
find_running_services

# Main command handling
case "${1:-status}" in
    "backend")
        log_info "Starting backend service..."
        if start_backend; then
            log_success "Backend started successfully!"
            show_status
        else
            log_error "Failed to start backend"
            exit 1
        fi
        ;;

    "hardkill")
        hardkill_backend
        ;;

    "start")
        log_info "Starting both frontend and backend services..."

        # Check if services are already running and healthy
        backend_running=false
        frontend_running=false

        if check_port $BACKEND_PORT && curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
            backend_running=true
            log_info "Backend already running and healthy on port $BACKEND_PORT"
        fi

        if check_port $FRONTEND_PORT && curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
            frontend_running=true
            log_info "Frontend already running and accessible on port $FRONTEND_PORT"
        fi

        # Stop unhealthy services only
        if ! $backend_running && check_port $BACKEND_PORT; then
            log_info "Stopping unhealthy backend service..."
            stop_backend >/dev/null 2>&1
        fi

        if ! $frontend_running && check_port $FRONTEND_PORT; then
            log_info "Stopping unhealthy frontend service..."
            stop_frontend >/dev/null 2>&1
        fi

        # Clean up old PID files for services we're starting
        if ! $backend_running; then
            rm -f backend.pid
        fi
        if ! $frontend_running; then
            rm -f frontend.pid
        fi

        # Start services that aren't already running
        backend_success=$backend_running
        frontend_success=$frontend_running

        if ! $backend_running; then
            start_backend &
            BACKEND_START_PID=$!
        fi

        if ! $frontend_running; then
            start_frontend &
            FRONTEND_START_PID=$!
        fi

        # Wait for services to start
        if ! $backend_running; then
            wait $BACKEND_START_PID 2>/dev/null
            if [ $? -eq 0 ]; then
                backend_success=true
            fi
        fi

        if ! $frontend_running; then
            wait $FRONTEND_START_PID 2>/dev/null
            if [ $? -eq 0 ]; then
                frontend_success=true
            fi
        fi

        if $backend_success && $frontend_success; then
            if $backend_running && $frontend_running; then
                log_success "Both services were already running and healthy!"
            else
                log_success "Services started successfully!"
            fi
            show_status
        else
            log_error "Failed to start some services"
            if ! $backend_success; then
                log_error "Failed to start backend"
            fi
            if ! $frontend_success; then
                log_error "Failed to start frontend"
            fi
            exit 1
        fi
        ;;

    "stop")
        log_info "Stopping both services..."
        stop_frontend
        stop_backend
        log_success "Both services stopped"
        ;;

    "restart")
        log_info "Restarting both services..."
        stop_frontend
        stop_backend
        # sleep 2

        # Start backend first
        if ! start_backend; then
            log_error "Failed to restart backend"
            exit 1
        fi

        # Start frontend
        if ! start_frontend; then
            log_error "Failed to restart frontend"
            stop_backend
            exit 1
        fi

        log_success "Both services restarted successfully!"
        show_status
        ;;

    "status")
        show_status
        ;;

    "logs")
        echo "=== Backend Logs ==="
        if [ -f "backend.log" ]; then
            echo "Last 20 lines from backend.log:"
            echo "---"
            tail -20 backend.log
            echo "---"
        else
            echo "No backend log file found (service may not have been started yet)"
        fi

        echo ""
        echo "=== Frontend Logs ==="
        if [ -f "frontend.log" ]; then
            echo "Last 20 lines from frontend.log:"
            echo "---"
            tail -20 frontend.log
            echo "---"
        else
            echo "No frontend log file found (service may not have been started yet)"
        fi
        ;;

    "clean")
        cleanup_logs
        ;;

    "live")
        live_monitoring
        ;;

    "console")
        live_console
        ;;

    "build")
        log_info "Building frontend for production..."
        build_frontend
        ;;

    *)
        echo "Usage: $0 {backend|hardkill|start|stop|restart|status|logs|clean|live|console|build}"
        echo ""
        echo "Commands:"
        echo "  backend  - Start only the backend service"
        echo "  hardkill - Force kill any backend processes on configured port"
        echo "  start    - Start both frontend and backend services"
        echo "  stop     - Stop both services"
        echo "  restart  - Restart both services"
        echo "  status   - Show current status of services"
        echo "  logs     - Show recent logs from both services"
        echo "  clean    - Remove log files and PID files"
        echo "  build    - Build frontend for production"
        echo "  live     - Live monitoring mode (keeps services running and restarts them if they crash)"
        echo "  console  - Live console monitoring mode (shows real-time status and logs)"
        echo ""
        echo "Examples:"
        echo "  $0 backend   # Start only backend service"
        echo "  $0 hardkill  # Force kill backend processes"
        echo "  $0 start     # Start both services"
        echo "  $0 stop      # Stop both services"
        echo "  $0 restart   # Restart both services"
        echo "  $0 status    # Check if services are running"
        echo "  $0 build     # Build frontend for production"
        echo "  $0 live      # Live monitoring mode"
        echo "  $0 console   # Live console monitoring mode"
        exit 1  
        ;;
esac

# Run validation
validate_environment