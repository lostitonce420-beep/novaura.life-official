#!/usr/bin/env node
/**
 * Deploy environment variables to Firebase Functions
 * Run: node scripts/deploy-env.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split('\n');

const vars = [];
for (const line of lines) {
  const trimmed = line.trim();
  // Skip comments and empty lines
  if (!trimmed || trimmed.startsWith('#')) continue;
  
  const match = trimmed.match(/^([A-Za-z0-9_]+)=(.+)$/);
  if (match) {
    const [, key, value] = match;
    // Remove quotes if present
    const cleanValue = value.replace(/^["'](.*)["']$/, '$1');
    vars.push(`${key}=${cleanValue}`);
  }
}

if (vars.length === 0) {
  console.error('❌ No environment variables found in .env file');
  process.exit(1);
}

console.log(`🚀 Deploying ${vars.length} environment variables to Firebase Functions...\n`);

// Deploy in batches of 20 (Firebase limit per command)
const batchSize = 20;
for (let i = 0; i < vars.length; i += batchSize) {
  const batch = vars.slice(i, i + batchSize);
  console.log(`Deploying batch ${Math.floor(i / batchSize) + 1}...`);
  
  try {
    execSync(`firebase functions:env:set ${batch.join(' ')}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  } catch (err) {
    console.error(`❌ Failed to deploy batch: ${err.message}`);
    process.exit(1);
  }
}

console.log('\n✅ Environment variables deployed successfully!');
console.log('\nNext steps:');
console.log('  1. Deploy functions: firebase deploy --only functions');
console.log('  2. Verify: firebase functions:env:get');
