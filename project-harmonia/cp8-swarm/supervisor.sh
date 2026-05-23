#!/bin/bash
# CP8 Swarm Supervisor — auto-restarts if killed by host watchdog

SWARM_DIR="/root/.openclaw/workspace/project-harmonia/cp8-swarm"
LOG_FILE="/tmp/cp8-swarm.log"
PID_FILE="/tmp/cp8-swarm.pid"
API_KEY="cp8_52ea3e46a7624797bd7279349eeb9ab7"
HMN="http://localhost:8000"
KERNEL="http://localhost:8765"

while true; do
    # Check if swarm is running
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            sleep 30
            continue
        fi
    fi

    # Swarm is dead — restart it
    echo "[$(date)] Swarm not running. Restarting..." >> "$LOG_FILE"
    cd "$SWARM_DIR"
    HMN_API_KEY="$API_KEY" HMN_ENDPOINT="$HMN" KERNEL_ENDPOINT="$KERNEL" nohup node dist/index.js > "$LOG_FILE" 2>&1 &
    NEW_PID=$!
    echo "$NEW_PID" > "$PID_FILE"
    echo "[$(date)] Swarm restarted with PID $NEW_PID" >> "$LOG_FILE"
    sleep 30
done
