// Authentication Fix Test Script
// Run this in browser console to test the authentication fixes

console.log('🔧 Testing Authentication Fixes...');

// Test 1: Check if tokens are present
function testTokenPresence() {
  console.log('✅ Test 1: Checking token presence...');
  
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  console.log('Access Token:', accessToken ? 'Present' : 'Missing');
  console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
  
  return !!(accessToken && refreshToken);
}

// Test 2: Check if authAxios is working
async function testAuthAxios() {
  console.log('✅ Test 2: Testing authenticated axios...');
  
  try {
    // Try to access a protected endpoint
    const response = await fetch('http://localhost:5000/auth/status', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    
    const data = await response.json();
    console.log('Auth status response:', data);
    
    return data.authenticated === true;
  } catch (error) {
    console.error('Auth axios test failed:', error);
    return false;
  }
}

// Test 3: Test like functionality
async function testLikeFunctionality() {
  console.log('✅ Test 3: Testing like functionality...');
  
  // Find a heart button
  const heartButtons = document.querySelectorAll('button[class*="heart"], button[class*="Heart"]');
  
  if (heartButtons.length === 0) {
    console.log('❌ No heart buttons found');
    return false;
  }
  
  console.log(`Found ${heartButtons.length} heart buttons`);
  
  // Test the first heart button
  const firstHeart = heartButtons[0];
  const originalText = firstHeart.innerHTML;
  
  console.log('Testing heart button click...');
  
  // Simulate click
  firstHeart.click();
  
  // Wait a moment and check if the button changed
  setTimeout(() => {
    const newText = firstHeart.innerHTML;
    console.log('Heart button changed:', originalText !== newText);
  }, 1000);
  
  return true;
}

// Test 4: Test edit functionality
function testEditFunctionality() {
  console.log('✅ Test 4: Testing edit functionality...');
  
  // Find an edit button
  const editButtons = document.querySelectorAll('button[class*="pencil"], button[class*="Pencil"]');
  
  if (editButtons.length === 0) {
    console.log('❌ No edit buttons found');
    return false;
  }
  
  console.log(`Found ${editButtons.length} edit buttons`);
  return true;
}

// Test 5: Test delete functionality
function testDeleteFunctionality() {
  console.log('✅ Test 5: Testing delete functionality...');
  
  // Find delete buttons
  const deleteButtons = document.querySelectorAll('button[class*="trash"], button[class*="Trash"]');
  
  if (deleteButtons.length === 0) {
    console.log('❌ No delete buttons found');
    return false;
  }
  
  console.log(`Found ${deleteButtons.length} delete buttons`);
  return true;
}

// Run all tests
async function runAuthTests() {
  console.log('🚀 Running authentication fix tests...\n');
  
  const tests = [
    { name: 'Token Presence', fn: testTokenPresence },
    { name: 'Auth Axios', fn: testAuthAxios },
    { name: 'Like Functionality', fn: testLikeFunctionality },
    { name: 'Edit Functionality', fn: testEditFunctionality },
    { name: 'Delete Functionality', fn: testDeleteFunctionality }
  ];
  
  const results = {};
  
  for (const test of tests) {
    try {
      if (test.fn.constructor.name === 'AsyncFunction') {
        results[test.name] = await test.fn();
      } else {
        results[test.name] = test.fn();
      }
    } catch (error) {
      console.error(`❌ Error in ${test.name}:`, error);
      results[test.name] = false;
    }
  }
  
  console.log('\n📊 Authentication Fix Test Results:');
  console.log('====================================');
  
  let passed = 0;
  let total = 0;
  
  for (const [testName, result] of Object.entries(results)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${testName}`);
    if (result) passed++;
    total++;
  }
  
  console.log(`\n📈 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All authentication tests passed! The fixes should be working.');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.');
  }
  
  return results;
}

// Manual test functions
function testLikeToggle() {
  console.log('🧪 Manual test: Like/Unlike');
  console.log('1. Find a heart icon on a note card');
  console.log('2. Click the heart icon');
  console.log('3. Check if it changes from outline to solid (or vice versa)');
  console.log('4. Check browser network tab for successful API call');
  console.log('5. Refresh page and verify like state persists');
}

function testEditNote() {
  console.log('🧪 Manual test: Edit Note');
  console.log('1. Find a note card with a pencil/edit icon');
  console.log('2. Click the edit button');
  console.log('3. Verify note becomes editable');
  console.log('4. Modify the text');
  console.log('5. Click the check mark to save');
  console.log('6. Verify changes are saved');
}

function testDeleteNote() {
  console.log('🧪 Manual test: Delete Note');
  console.log('1. Find a note card with a trash/delete icon');
  console.log('2. Click the delete button');
  console.log('3. Verify confirmation dialog appears');
  console.log('4. Confirm deletion');
  console.log('5. Verify note is removed from list');
}

function testDeleteBookmarkCard() {
  console.log('🧪 Manual test: Delete Bookmark Card');
  console.log('1. Go to main dashboard');
  console.log('2. Find a video card with delete button');
  console.log('3. Click the delete button');
  console.log('4. Verify confirmation dialog appears');
  console.log('5. Confirm deletion');
  console.log('6. Verify video card is removed from dashboard');
}

// Export functions
window.authTests = {
  runAuthTests,
  testLikeToggle,
  testEditNote,
  testDeleteNote,
  testDeleteBookmarkCard
};

console.log('📝 Auth test functions loaded. Run authTests.runAuthTests() to start tests.');
console.log('📝 Manual test functions available:');
console.log('- authTests.testLikeToggle()');
console.log('- authTests.testEditNote()');
console.log('- authTests.testDeleteNote()');
console.log('- authTests.testDeleteBookmarkCard()'); 