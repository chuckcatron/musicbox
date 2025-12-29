# Music Box - Running the Apps

## Prerequisites

- Node.js 20+
- npm 10+
- AWS CLI configured with credentials
- Docker (for CDK deployments)
- Apple Developer account with MusicKit enabled

---

## Initial Setup

### 1. Install Dependencies

```bash
cd "/Users/chuckcatron/Code/music box"
npm install
```

### 2. Build the Shared Package

```bash
npm run build --workspace=@music-box/shared
```

---

## Running Locally

### API (NestJS) - Port 3001

```bash
# Create environment file
cp apps/api/.env.example apps/api/.env

# Edit apps/api/.env with your values:
# - COGNITO_USER_POOL_ID (from AWS after deployment, or use a test pool)
# - COGNITO_REGION
# - APPLE_MUSIC_TEAM_ID
# - APPLE_MUSIC_KEY_ID
# - APPLE_MUSIC_PRIVATE_KEY
# - API_KEY (generate any secure string)

# Run the API
npm run dev --workspace=@music-box/api
```

The API will be available at `http://localhost:3001`

### Web (Next.js) - Port 3000

```bash
# Create environment file
cp apps/web/.env.example apps/web/.env.local

# Edit apps/web/.env.local with your values:
# - NEXT_PUBLIC_COGNITO_USER_POOL_ID
# - NEXT_PUBLIC_COGNITO_CLIENT_ID
# - NEXT_PUBLIC_COGNITO_REGION
# - NEXT_PUBLIC_API_URL=http://localhost:3001
# - NEXT_PUBLIC_APPLE_MUSIC_DEVELOPER_TOKEN

# Run the web app
npm run dev --workspace=@music-box/web
```

The web app will be available at `http://localhost:3000`

### Pi Client (for development on Mac/Linux)

```bash
# Create environment file
cp apps/pi/.env.example apps/pi/.env

# Edit apps/pi/.env:
# - MUSIC_BOX_API_URL=http://localhost:3001
# - MUSIC_BOX_API_KEY (same as API_KEY in api/.env)
# - MUSIC_BOX_USER_ID (your Cognito user ID after signing up)

# Build and run
npm run dev --workspace=@music-box/pi
```

In simulation mode (no GPIO), press:
- `P` - Play random song
- `S` - Stop playback
- `Q` - Quit

---

## AWS Deployment

### Step 1: Configure AWS CLI

```bash
aws configure
# Enter your AWS Access Key ID, Secret, and region (e.g., us-east-1)
```

### Step 2: Bootstrap CDK (First Time Only)

```bash
cd infra
npx cdk bootstrap
```

### Step 3: Deploy Infrastructure

Deploy stacks in order:

```bash
cd infra

# Deploy Auth stack (Cognito)
npm run deploy:auth

# Deploy Data stack (DynamoDB tables)
npm run deploy:data

# Deploy API stack (Lambda + API Gateway)
# First, build the API:
cd ../apps/api && npm run build && cd ../../infra
npm run deploy:api

# Deploy Web stack (S3 + CloudFront)
npm run deploy:web
```

Or deploy all at once:

```bash
# Build API first
npm run build --workspace=@music-box/api

# Deploy all stacks
cd infra
npm run deploy
```

### Step 4: Note the Outputs

After deployment, CDK will output:
- `MusicBoxAuthStack.UserPoolId` - Cognito User Pool ID
- `MusicBoxAuthStack.UserPoolClientId` - Cognito Client ID
- `MusicBoxApiStack.ApiEndpoint` - API Gateway URL
- `MusicBoxApiStack.ApiKey` - API Key for Pi devices
- `MusicBoxWebStack.DistributionUrl` - CloudFront URL

### Step 5: Upload Web Assets

```bash
# Build the web app with production env vars
cd apps/web

# Create .env.local with production values from CDK outputs
cat > .env.local << EOF
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<UserPoolId from output>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<UserPoolClientId from output>
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_API_URL=<ApiEndpoint from output>
NEXT_PUBLIC_APPLE_MUSIC_DEVELOPER_TOKEN=<your developer token>
EOF

# Build static export
npm run build

# Upload to S3
aws s3 sync out/ s3://<BucketName from output> --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id <DistributionId> --paths "/*"
```

---

## Apple Music Setup

### 1. Create MusicKit Identifier

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles
3. Create a new MusicKit Identifier

### 2. Create Private Key

1. Go to Keys section
2. Create a new key with MusicKit enabled
3. Download the .p8 file
4. Note the Key ID

### 3. Generate Developer Token

The API generates developer tokens automatically using your credentials. Set these environment variables:

```bash
APPLE_MUSIC_TEAM_ID=<Your Team ID>
APPLE_MUSIC_KEY_ID=<Your Key ID>
APPLE_MUSIC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
<contents of your .p8 file>
-----END PRIVATE KEY-----"
```

For the web app, you need a pre-generated developer token. You can generate one using:

```javascript
// Run with Node.js
const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('AuthKey_XXXXXX.p8');
const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  issuer: 'YOUR_TEAM_ID',
  header: {
    alg: 'ES256',
    kid: 'YOUR_KEY_ID'
  }
});

console.log(token);
```

---

## Pi Deployment

### 1. Setup Raspberry Pi

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install mpv for audio playback
sudo apt-get install -y mpv

# Clone or copy the project
git clone <your-repo> ~/music-box
cd ~/music-box

# Install dependencies
npm install

# Build
npm run build --workspace=@music-box/shared
npm run build --workspace=@music-box/pi
```

### 2. Configure

```bash
# Create environment file
cat > apps/pi/.env << EOF
MUSIC_BOX_API_URL=<ApiEndpoint from CDK output>
MUSIC_BOX_API_KEY=<ApiKey from CDK output>
MUSIC_BOX_USER_ID=<Your Cognito user ID>
GPIO_PLAY_BUTTON=17
GPIO_STOP_BUTTON=27
EOF
```

### 3. Wire Buttons

Connect buttons to GPIO pins:
- Play button: GPIO 17 (pin 11) to GND (pin 9)
- Stop button: GPIO 27 (pin 13) to GND (pin 14)

### 4. Run as Service

```bash
# Create systemd service
sudo tee /etc/systemd/system/music-box.service << EOF
[Unit]
Description=Music Box Pi Client
After=network.target

[Service]
ExecStart=/usr/bin/node /home/pi/music-box/apps/pi/dist/index.js
WorkingDirectory=/home/pi/music-box/apps/pi
EnvironmentFile=/home/pi/music-box/apps/pi/.env
User=pi
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable music-box
sudo systemctl start music-box

# Check status
sudo systemctl status music-box

# View logs
journalctl -u music-box -f
```

---

## Troubleshooting

### API build fails

```bash
# Ensure shared package is built first
npm run build --workspace=@music-box/shared

# Then build API
npm run build --workspace=@music-box/api
```

### CDK deployment fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Bootstrap CDK if not done
cd infra && npx cdk bootstrap

# Check for errors in synth
npx cdk synth
```

### MusicKit authorization fails

- Ensure your domain is registered in Apple Developer Portal
- For localhost, add `localhost` to your MusicKit domains
- Check browser console for specific errors

### Pi can't connect to API

```bash
# Test API connectivity
curl -H "x-api-key: YOUR_API_KEY" https://YOUR_API_URL/health

# Check Pi logs
journalctl -u music-box -f
```
