// Simple test script to verify API setup
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API health endpoint...');
    
    const response = await fetch('http://localhost:3001/api/health');
    const data = await response.json();
    
    console.log('API Health Check Result:', data);
    
    if (data.apiKeyConfigured) {
      console.log('✅ API key is configured');
    } else {
      console.log('❌ API key is not configured');
      console.log('Please add your AssemblyAI API key to the .env file');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('Make sure the server is running on port 3001');
  }
}

testAPI(); 