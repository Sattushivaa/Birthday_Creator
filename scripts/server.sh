#!/usr/bin/env bash
# Dev convenience: start the API server detached from the terminal.
# Logs go to a local file so you can tail them.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .runtime
LOG=.runtime/server.log

stop_server() {
  if [ -f .runtime/server.pid ]; then
    kill "$(cat .runtime/server.pid)" 2>/dev/null || true
    rm -f .runtime/server.pid
  fi
}

case "${1:-start}" in
  start)
    stop_server
    nohup node server/index.js > "$LOG" 2>&1 &
    echo $! > .runtime/server.pid
    echo "server started (pid $(cat .runtime/server.pid)) → http://localhost:3001  | log: $LOG"
    ;;
  stop)
    stop_server
    echo "server stopped"
    ;;
  restart)
    stop_server
    sleep 0.4
    nohup node server/index.js > "$LOG" 2>&1 &
    echo $! > .runtime/server.pid
    echo "server restarted (pid $(cat .runtime/server.pid))"
    ;;
  logs)
    tail -f "$LOG"
    ;;
  *)
    echo "usage: $0 [start|stop|restart|logs]"
    ;;
esac