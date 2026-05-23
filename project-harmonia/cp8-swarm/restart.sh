#!/bin/bash
cd /root/.openclaw/workspace/project-harmonia/cp8-swarm
export HMN_API_KEY=cp8_52ea3e46a7624797bd7279349eeb9ab7
export HMN_ENDPOINT=http://localhost:8000
export CP8_KERNEL=http://localhost:8765
export WATCH_DIR=/root/.openclaw/workspace/downloads
export TICK_MULTIPLIER=1
nohup node dist/index.js > /tmp/cp8-swarm.log 2>&1 &
echo $! > /tmp/cp8-swarm.pid
echo "Swarm started with PID $(cat /tmp/cp8-swarm.pid)"
