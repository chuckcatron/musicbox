#!/bin/bash

# Music Box - Setup systemd service on Raspberry Pi
# Run this script ON the Raspberry Pi after deployment
# Usage: ./setup-pi-service.sh

set -e

SERVICE_NAME="music-box"
WORKING_DIR="$HOME/music-box/apps/pi"
ENV_FILE="$WORKING_DIR/.env"

echo "=========================================="
echo "Music Box - Setup systemd Service"
echo "=========================================="

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found!"
  echo ""
  echo "Create it first with:"
  echo "  nano $ENV_FILE"
  echo ""
  echo "Required contents:"
  echo "  MUSIC_BOX_API_URL=<your API URL>"
  echo "  MUSIC_BOX_API_KEY=<your API key>"
  echo "  MUSIC_BOX_USER_ID=<your user ID>"
  echo "  GPIO_PLAY_BUTTON=17"
  echo "  GPIO_STOP_BUTTON=27"
  exit 1
fi

# Create systemd service file
echo "Creating systemd service..."
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null << EOF
[Unit]
Description=Music Box Pi Client
After=network.target sound.target

[Service]
Type=simple
ExecStart=/usr/bin/node ${WORKING_DIR}/dist/index.js
WorkingDirectory=${WORKING_DIR}
EnvironmentFile=${ENV_FILE}
User=${USER}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "Reloading systemd..."
sudo systemctl daemon-reload

# Enable service
echo "Enabling service..."
sudo systemctl enable ${SERVICE_NAME}

# Start service
echo "Starting service..."
sudo systemctl start ${SERVICE_NAME}

# Show status
echo ""
echo "=========================================="
echo "Service Status"
echo "=========================================="
sudo systemctl status ${SERVICE_NAME} --no-pager

echo ""
echo "=========================================="
echo "Useful commands:"
echo "=========================================="
echo "  sudo systemctl status ${SERVICE_NAME}   # Check status"
echo "  sudo systemctl stop ${SERVICE_NAME}     # Stop service"
echo "  sudo systemctl start ${SERVICE_NAME}    # Start service"
echo "  sudo systemctl restart ${SERVICE_NAME}  # Restart service"
echo "  journalctl -u ${SERVICE_NAME} -f        # View logs"
echo ""
