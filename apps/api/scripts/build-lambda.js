import { execSync } from 'child_process';
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const apiDir = join(__dirname, '..');
const bundleDir = join(apiDir, 'lambda-bundle');
const monorepoRoot = join(apiDir, '../..');

console.log('Building Lambda bundle for NestJS API...');

// Clean and create bundle directory
if (existsSync(bundleDir)) {
  rmSync(bundleDir, { recursive: true });
}
mkdirSync(bundleDir);

// Build the API first
console.log('Building NestJS app...');
execSync('npm run build', { cwd: apiDir, stdio: 'inherit' });

// Copy dist folder
console.log('Copying dist folder...');
cpSync(join(apiDir, 'dist'), join(bundleDir, 'dist'), { recursive: true });

// Create a minimal package.json for the lambda
const pkg = JSON.parse(readFileSync(join(apiDir, 'package.json'), 'utf8'));
const lambdaPkg = {
  name: pkg.name,
  version: pkg.version,
  type: 'module',
  dependencies: { ...pkg.dependencies },
};

// Remove the local workspace dependency
delete lambdaPkg.dependencies['@music-box/shared'];

writeFileSync(join(bundleDir, 'package.json'), JSON.stringify(lambdaPkg, null, 2));

// Install production dependencies
console.log('Installing production dependencies...');
execSync('npm install --production --ignore-scripts', {
  cwd: bundleDir,
  stdio: 'inherit',
  env: { ...process.env, npm_config_legacy_peer_deps: 'true' }
});

// Copy the shared package
console.log('Copying shared package...');
const sharedSrc = join(monorepoRoot, 'packages/shared');
const sharedDest = join(bundleDir, 'node_modules/@music-box/shared');
mkdirSync(join(bundleDir, 'node_modules/@music-box'), { recursive: true });
cpSync(sharedSrc, sharedDest, { recursive: true });

// Remove unnecessary files from shared package
const sharedFilesToRemove = ['src', 'tsconfig.json', 'node_modules'];
for (const file of sharedFilesToRemove) {
  const filePath = join(sharedDest, file);
  if (existsSync(filePath)) {
    rmSync(filePath, { recursive: true });
  }
}

console.log('Lambda bundle created successfully at:', bundleDir);
