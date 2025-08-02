// Server Status Check Script
// Run this to verify if backend and frontend servers are running

console.log('🔍 Checking server status...');

async function checkServer(url, name) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors' // This allows checking even if CORS is not configured
    });
    console.log(`✅ ${name} is running at ${url}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} is not running at ${url}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function checkAllServers() {
  console.log('🚀 Checking all servers...\n');
  
  const servers = [
    { url: 'http://localhost:5000', name: 'Backend Server' },
    { url: 'http://localhost:5173', name: 'Frontend Server' }
  ];
  
  const results = {};
  
  for (const server of servers) {
    results[server.name] = await checkServer(server.url, server.name);
  }
  
  console.log('\n📊 Server Status Summary:');
  console.log('========================');
  
  let running = 0;
  let total = 0;
  
  for (const [serverName, isRunning] of Object.entries(results)) {
    const status = isRunning ? '✅ RUNNING' : '❌ NOT RUNNING';
    console.log(`${status} ${serverName}`);
    if (isRunning) running++;
    total++;
  }
  
  console.log(`\n📈 Overall: ${running}/${total} servers running`);
  
  if (running === total) {
    console.log('🎉 All servers are running! You can now test the dashboard functionalities.');
    console.log('\n📝 Next steps:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Login with Google OAuth');
    console.log('3. Test the dashboard functionalities');
    console.log('4. Run the test script in browser console');
  } else {
    console.log('⚠️ Some servers are not running. Please start them first.');
    console.log('\n📝 To start servers:');
    console.log('1. Backend: cd backend && npm run dev');
    console.log('2. Frontend: cd dashboard && npm run dev');
  }
  
  return results;
}

// Export for use
window.checkServers = checkAllServers;

console.log('📝 Run checkServers() to check server status'); 