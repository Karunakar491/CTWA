// Simple script to run the Meta API integration test
const { execSync } = require('child_process');
const path = require('path');

try {
  console.log('Running Meta API integration test...');
  
  // Run the test script using ts-node
  execSync('npx ts-node src/clean/test-meta-api.ts', {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}