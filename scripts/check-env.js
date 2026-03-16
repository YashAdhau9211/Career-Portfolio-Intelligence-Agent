#!/usr/bin/env node

/**
 * Environment Variable Checker
 * Run this script to validate your environment configuration
 * Usage: node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.log('\n📝 To fix this:');
  console.log('   1. Copy .env.local.template to .env.local');
  console.log('   2. Fill in your API keys and configuration');
  console.log('\nRun: cp .env.local.template .env.local\n');
  process.exit(1);
}

// Parse .env.local file
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Required variables
const required = [
  'GEMINI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
];

// Optional variables
const optional = ['NEXT_PUBLIC_APP_URL', 'NODE_ENV'];

console.log('🔍 Checking environment variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('Required Variables:');
required.forEach((key) => {
  const value = envVars[key];
  if (!value || value === '') {
    console.log(`  ❌ ${key}: Missing`);
    hasErrors = true;
  } else if (value.includes('your_') || value.includes('your-')) {
    console.log(`  ⚠️  ${key}: Placeholder value detected`);
    hasWarnings = true;
  } else {
    const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
    console.log(`  ✓ ${key}: ${masked}`);
  }
});

console.log('\nOptional Variables:');
optional.forEach((key) => {
  const value = envVars[key];
  if (!value || value === '') {
    console.log(`  ⚠️  ${key}: Not set (will use default)`);
    hasWarnings = true;
  } else {
    console.log(`  ✓ ${key}: ${value}`);
  }
});

// Validate formats
console.log('\nValidation Checks:');

// Check Supabase URL format
const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    if (url.hostname.includes('supabase.co')) {
      console.log('  ✓ Supabase URL format is valid');
    } else {
      console.log('  ⚠️  Supabase URL does not appear to be a valid Supabase URL');
      hasWarnings = true;
    }
  } catch {
    console.log('  ❌ Supabase URL is not a valid URL');
    hasErrors = true;
  }
}

// Check Gemini API key length
const geminiKey = envVars['GEMINI_API_KEY'];
if (geminiKey && geminiKey.length < 20) {
  console.log('  ⚠️  Gemini API key appears to be too short');
  hasWarnings = true;
} else if (geminiKey) {
  console.log('  ✓ Gemini API key length looks valid');
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Environment validation FAILED');
  console.log('\n📖 See docs/ENVIRONMENT_SETUP.md for setup instructions\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Environment validation passed with warnings');
  console.log('\n💡 Review the warnings above and update your .env.local if needed\n');
  process.exit(0);
} else {
  console.log('✅ Environment validation PASSED');
  console.log('\n🚀 You\'re ready to run the application!\n');
  process.exit(0);
}
