#!/usr/bin/env bash
set -euo pipefail

# ==========================
# InfraFlow Federated Bootstrap
# Starts: Argus/MindMax, Signaling, IPFS publish (visuals)
# Outputs: local test URLs + IPFS CID
# ==========================

# ---- CONFIG (edit as needed) ----
ARGUS_DIR="${ARGUS_DIR:-/root/argus-prime}"
SIGNAL_DIR="${SIGNAL_DIR:-/root/infraflow-signaling}"
VISUALS_DIR="${VISUALS_DIR:-$(pwd)/visuals}"
IPFS_BIN="${IPFS_BIN:-ipfs}"
IPFS_API="${IPFS_API:-http://127.0.0.1:5001}"
IPFS_GATEWAY="${IPFS_GATEWAY:-https://ipfs.io/ipfs}"
ARGUS_PORT="${ARGUS_PORT:-8080}"
SIGNAL_PORT="${SIGNAL_PORT:-9001}"
VISUALS_PORT="${VISUALS_PORT:-8082}"

# ---- Helpers ----
say(){ echo -e "\n[InfraFlow] $*"; }
need(){ command -v "$1" >/dev/null 2>&1 || { echo "[ERROR] Missing dependency: $1"; exit 1; }; }

# ---- Check deps ----
need curl
need python3
need node || true
need npm || true

# ---- Start Argus/MindMax (Uvicorn app inside main.py) ----
start_argus() {
  if [[ -f "$ARGUS_DIR/main.py" ]]; then
    say "Starting Argus/MindMax from $ARGUS_DIR/main.py (port $ARGUS_PORT)..."
    # If already running, don’t duplicate
    if lsof -iTCP -sTCP:LISTEN -P | grep -q ":$ARGUS_PORT"; then
      say "Argus already listening on :$ARGUS_PORT"
    else
      (cd "$ARGUS_DIR" && nohup python3 main.py > /tmp/argus.log 2>&1 &)
      sleep 2
    fi
    say "Argus log: /tmp/argus.log"
    say "Argus URL: http://localhost:$ARGUS_PORT"
  else
    say "Argus not found at $ARGUS_DIR/main.py (skipping)"
  fi
}

# ---- Start signaling server (WebSocket) ----
start_signaling() {
  if [[ -f "$SIGNAL_DIR/signaling_server.js" ]]; then
    say "Starting signaling server (port $SIGNAL_PORT)..."
    if lsof -iTCP -sTCP:LISTEN -P | grep -q ":$SIGNAL_PORT"; then
      say "Signaling already listening on :$SIGNAL_PORT"
    else
      (cd "$SIGNAL_DIR" && nohup node signaling_server.js > /tmp/signaling.log 2>&1 &)
      sleep 1
    fi
    say "Signaling log: /tmp/signaling.log"
    say "Signaling WS: ws://localhost:$SIGNAL_PORT"
  else
    say "No signaling_server.js at $SIGNAL_DIR (skipping)"
  fi
}

# ---- Start IPFS (kubo) if installed ----
start_ipfs() {
  if command -v "$IPFS_BIN" >/dev/null 2>&1; then
    say "IPFS found. Ensuring daemon is running..."
    if curl -s "$IPFS_API/api/v0/version" >/dev/null 2>&1; then
      say "IPFS API reachable at $IPFS_API"
    else
      say "Starting IPFS daemon..."
      nohup $IPFS_BIN daemon > /tmp/ipfs.log 2>&1 &
      sleep 3
    fi
    say "IPFS log: /tmp/ipfs.log"
  else
    say "IPFS not installed (skipping publish)"
  fi
}

# ---- Publish visuals folder to IPFS, output CID + gateway URL ----
publish_visuals() {
  if command -v "$IPFS_BIN" >/dev/null 2>&1 && [[ -d "$VISUALS_DIR" ]]; then
    say "Publishing visuals to IPFS from: $VISUALS_DIR"
    CID=$($IPFS_BIN add -Qr "$VISUALS_DIR")
    say "VISUALS CID: $CID"
    say "Gateway URL: $IPFS_GATEWAY/$CID/"
    echo "$CID" > /tmp/infraflow_visuals_cid.txt
  else
    say "Visuals dir not found or IPFS missing (skipping publish)"
  fi
}

# ---- Optional: Serve visuals locally for quick testing ----
serve_visuals() {
  if [[ -d "$VISUALS_DIR" ]]; then
    say "Serving visuals locally on http://localhost:$VISUALS_PORT (python http.server)"
    if lsof -iTCP -sTCP:LISTEN -P | grep -q ":$VISUALS_PORT"; then
      say "Visuals server already listening on :$VISUALS_PORT"
    else
      (cd "$VISUALS_DIR" && nohup python3 -m http.server "$VISUALS_PORT" > /tmp/visuals.log 2>&1 &)
      sleep 1
    fi
    say "Visuals log: /tmp/visuals.log"
  else
    say "No visuals dir at $VISUALS_DIR (skipping local serve)"
  fi
}

# ---- Coinfile (simple “tiers/payments” manifest for later integrations) ----
write_coinfile() {
  COINFILE="$(pwd)/coinfile.json"
  say "Writing coinfile to $COINFILE"
  cat > "$COINFILE" <<'JSON'
{
  "name": "InfraFlow Federated Access",
  "version": "0.1.0",
  "pricing": {
    "basic_monthly_usd": 10,
    "pro_monthly_usd": 49,
    "enterprise_monthly_usd": 199
  },
  "payments": {
    "stripe": {
      "enabled": true,
      "note": "Stripe Connect + Checkout handled in WealthBridge backend"
    },
    "stablecoin": {
      "enabled": true,
      "note": "Bridge stablecoin + factory handled in WealthBridge backend"
    }
  },
  "access": {
    "mesh": true,
    "ipfs": true,
    "pqc": "kyber+dilithium (planned)"
  }
}
JSON
  say "coinfile.json written."
}

# ---- Run ----
say "Bootstrapping InfraFlow Federated Access..."
start_argus
start_signaling
start_ipfs
publish_visuals
serve_visuals
write_coinfile

say "DONE."
say "Test checklist:"
echo " - Argus:      http://localhost:$ARGUS_PORT"
echo " - Signaling:  ws://localhost:$SIGNAL_PORT"
echo " - Visuals:    http://localhost:$VISUALS_PORT"
if [[ -f /tmp/infraflow_visuals_cid.txt ]]; then
  echo " - IPFS CID:   $(cat /tmp/infraflow_visuals_cid.txt)"
fi
