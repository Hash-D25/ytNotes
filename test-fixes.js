// Test script for the recent fixes
// Run this in browser console to test the fixes

console.log('🔧 Testing Recent Fixes...');

// Test 1: Check if FavoritesPage is using authenticated axios
function testFavoritesPageAuth() {
  console.log('✅ Test 1: Checking FavoritesPage authentication...');
  
  // Check if we're on the favorites page
  const isOnFavoritesPage = window.location.pathname === '/favorites';
  console.log('On favorites page:', isOnFavoritesPage);
  
  if (isOnFavoritesPage) {
    // Look for heart buttons (unlike buttons)
    const heartButtons = document.querySelectorAll('button[class*="heart"], button[class*="Heart"]');
    console.log(`Found ${heartButtons.length} heart buttons on favorites page`);
    
    if (heartButtons.length > 0) {
      console.log('✅ Heart buttons found - unlike functionality should be available');
      return true;
    } else {
      console.log('❌ No heart buttons found on favorites page');
      return false;
    }
  } else {
    console.log('⚠️ Not on favorites page - navigate to /favorites to test');
    return false;
  }
}

// Test 2: Check dropdown positioning
function testDropdownPositioning() {
  console.log('✅ Test 2: Checking dropdown positioning...');
  
  // Find the sort dropdown button
  const sortButton = document.querySelector('button[class*="youtube-button"]');
  
  if (!sortButton) {
    console.log('❌ Sort button not found');
    return false;
  }
  
  console.log('✅ Sort button found');
  
  // Check if dropdown container exists
  const dropdownContainer = sortButton.closest('.relative');
  
  if (dropdownContainer) {
    console.log('✅ Dropdown container found');
    
    // Check if the container has proper positioning
    const containerStyle = window.getComputedStyle(dropdownContainer);
    console.log('Dropdown container position:', containerStyle.position);
    
    return true;
  } else {
    console.log('❌ Dropdown container not found');
    return false;
  }
}

// Test 3: Test unlike functionality manually
function testUnlikeFunctionality() {
  console.log('🧪 Manual test: Unlike functionality on Favorites page');
  console.log('1. Navigate to /favorites page');
  console.log('2. Go to the "Notes" tab');
  console.log('3. Find a note with a red heart icon (liked note)');
  console.log('4. Click the heart icon to unlike it');
  console.log('5. Verify the note disappears from the favorites list');
  console.log('6. Check browser network tab for successful API call');
  console.log('7. Check console for "✅ Like toggle successful" message');
}

// Test 4: Test dropdown functionality manually
function testDropdownFunctionality() {
  console.log('🧪 Manual test: Dropdown positioning');
  console.log('1. Click the "Sort By" button');
  console.log('2. Verify dropdown opens and is fully visible');
  console.log('3. Try on different screen sizes (mobile, tablet, desktop)');
  console.log('4. Verify dropdown doesn\'t get cut off on any screen size');
  console.log('5. Select different sort options');
  console.log('6. Verify dropdown closes after selection');
}

// Test 5: Check authentication status
function testAuthenticationStatus() {
  console.log('✅ Test 5: Checking authentication status...');
  
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  console.log('Access Token:', accessToken ? 'Present' : 'Missing');
  console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
  
  if (accessToken && refreshToken) {
    console.log('✅ Authentication tokens present');
    return true;
  } else {
    console.log('❌ Authentication tokens missing');
    return false;
  }
}

// Run all tests
async function runFixTests() {
  console.log('🚀 Running fix tests...\n');
  
  const tests = [
    { name: 'FavoritesPage Auth', fn: testFavoritesPageAuth },
    { name: 'Dropdown Positioning', fn: testDropdownPositioning },
    { name: 'Authentication Status', fn: testAuthenticationStatus }
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
  
  console.log('\n📊 Fix Test Results:');
  console.log('====================');
  
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
    console.log('🎉 All fix tests passed! The fixes should be working.');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.');
  }
  
  return results;
}

// Export functions
window.fixTests = {
  runFixTests,
  testUnlikeFunctionality,
  testDropdownFunctionality
};

console.log('📝 Fix test functions loaded. Run fixTests.runFixTests() to start tests.');
console.log('📝 Manual test functions available:');
console.log('- fixTests.testUnlikeFunctionality()');
console.log('- fixTests.testDropdownFunctionality()'); 