// Simple script to get tokens from dashboard localStorage
// Run this in the browser console on the dashboard page

console.log('🔍 Getting tokens from localStorage...');

const accessToken = localStorage.getItem('accessToken');
const refreshToken = localStorage.getItem('refreshToken');

console.log('📋 Tokens found:');
console.log('Access Token:', accessToken ? accessToken.substring(0, 50) + '...' : 'NOT FOUND');
console.log('Refresh Token:', refreshToken ? refreshToken.substring(0, 50) + '...' : 'NOT FOUND');

if (accessToken && refreshToken) {
  console.log('✅ Both tokens found! You can copy them to the extension.');
  console.log('Access Token (full):', accessToken);
  console.log('Refresh Token (full):', refreshToken);
} else {
  console.log('❌ Tokens not found. Make sure you are logged in to the dashboard.');
} 