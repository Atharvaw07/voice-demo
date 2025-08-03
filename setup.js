#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Voice Demo Setup Script');
console.log('==========================\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  try {
    const envExample = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, envExample);
    console.log('✅ .env file created successfully!');
    console.log('⚠️  Remember to add your AssemblyAI API key to the .env file');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
  }
} else {
  console.log('✅ .env file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('Installing client dependencies...');
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, 'client') });
  
  console.log('✅ All dependencies installed successfully!');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

console.log('\n🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Add your AssemblyAI API key to the .env file');
console.log('2. Run "npm run dev" to start the application');
console.log('3. Open http://localhost:3000 in your browser');
console.log('\nFor more help, see SETUP.md'); 