#!/bin/bash

# Music Box - Deploy to Raspberry Pi
# Usage: ./scripts/deploy-to-pi.sh <pi-hostname-or-ip> [username]
# Example: ./scripts/deploy-to-pi.sh 192.168.1.100 pi
# Example: ./scripts/deploy-to-pi.sh musicbox.local

set -e

PI_HOST="${1:-}"
PI_USER="${2:-pi}"
REMOTE_DIR="~/music-box"

if [ -z "$PI_HOST" ]; then
  echo "Usage: $0 <pi-hostname-or-ip> [username]"
  echo "Example: $0 192.168.1.100 pi"
  echo "Example: $0 musicbox.local"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=========================================="
echo "Music Box - Deploy to Raspberry Pi"
echo "=========================================="
echo "Target: ${PI_USER}@${PI_HOST}"
echo "Project: ${PROJECT_ROOT}"
echo ""

# Step 1: Build locally first
echo "[1/5] Building shared package..."
cd "$PROJECT_ROOT"
npm run build --workspace=@music-box/shared

echo "[2/5] Building Pi client..."
npm run build --workspace=@music-box/pi

# Step 2: Create remote directory structure
echo "[3/5] Setting up remote directories..."
ssh "${PI_USER}@${PI_HOST}" "mkdir -p ${REMOTE_DIR}/apps/pi ${REMOTE_DIR}/packages/shared"

# Step 3: Sync files
echo "[4/5] Syncing files to Pi..."

# Sync shared package (built)
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude 'src' \
  "${PROJECT_ROOT}/packages/shared/" \
  "${PI_USER}@${PI_HOST}:${REMOTE_DIR}/packages/shared/"

# Sync Pi app (built)
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude 'src' \
  "${PROJECT_ROOT}/apps/pi/" \
  "${PI_USER}@${PI_HOST}:${REMOTE_DIR}/apps/pi/"

# Sync root package.json
scp "${PROJECT_ROOT}/package.json" "${PI_USER}@${PI_HOST}:${REMOTE_DIR}/"

# Step 4: Install dependencies on Pi
echo "[5/5] Installing dependencies on Pi..."
ssh "${PI_USER}@${PI_HOST}" << 'ENDSSH'
cd ~/music-box

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Node.js not found. Installing..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Check if mpv is installed
if ! command -v mpv &> /dev/null; then
  echo "mpv not found. Installing..."
  sudo apt-get install -y mpv
fi

# Install npm dependencies
npm install --omit=dev

echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
ENDSSH

echo ""
echo "=========================================="
echo "Next steps:"
echo "=========================================="
echo ""
echo "1. SSH into your Pi:"
echo "   ssh ${PI_USER}@${PI_HOST}"
echo ""
echo "2. Create the .env file:"
echo "   nano ${REMOTE_DIR}/apps/pi/.env"
echo ""
echo "   Add these values:"
echo "   MUSIC_BOX_API_URL=<your API Gateway URL>"
echo "   MUSIC_BOX_API_KEY=<your API key from CDK output>"
echo "   MUSIC_BOX_USER_ID=<your Cognito user ID>"
echo "   GPIO_PLAY_BUTTON=17"
echo "   GPIO_STOP_BUTTON=27"
echo ""
echo "3. Test the app:"
echo "   cd ${REMOTE_DIR}/apps/pi && npm start"
echo ""
echo "4. Set up as a service (optional):"
echo "   sudo nano /etc/systemd/system/music-box.service"
echo ""
