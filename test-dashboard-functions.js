// Dashboard Functionality Test Script
// Run this in browser console to test dashboard functions

console.log('🧪 Starting Dashboard Functionality Tests...');

// Test 1: Check if all required components are loaded
function testComponentLoading() {
  console.log('✅ Test 1: Checking component loading...');
  
  const components = {
    'NoteCard': typeof NoteCard !== 'undefined',
    'BookmarkCard': typeof BookmarkCard !== 'undefined',
    'NotesList': typeof NotesList !== 'undefined',
    'NotesPage': typeof NotesPage !== 'undefined'
  };
  
  console.log('Component loading status:', components);
  return Object.values(components).every(Boolean);
}

// Test 2: Check API endpoints availability
async function testAPIEndpoints() {
  console.log('✅ Test 2: Checking API endpoints...');
  
  const endpoints = [
    'http://localhost:5000/videos',
    'http://localhost:5000/bookmark',
    'http://localhost:5000/auth/status'
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      results[endpoint] = response.status;
    } catch (error) {
      results[endpoint] = 'Error: ' + error.message;
    }
  }
  
  console.log('API endpoint status:', results);
  return Object.values(results).every(status => status === 200 || status === 401);
}

// Test 3: Check authentication status
function testAuthentication() {
  console.log('✅ Test 3: Checking authentication...');
  
  const authStatus = {
    'accessToken': !!localStorage.getItem('accessToken'),
    'refreshToken': !!localStorage.getItem('refreshToken'),
    'userEmail': !!localStorage.getItem('userEmail')
  };
  
  console.log('Authentication status:', authStatus);
  return Object.values(authStatus).every(Boolean);
}

// Test 4: Check UI elements presence
function testUIElements() {
  console.log('✅ Test 4: Checking UI elements...');
  
  const elements = {
    'Search input': !!document.querySelector('input[placeholder*="search"]'),
    'Sort dropdown': !!document.querySelector('select'),
    'Video cards': !!document.querySelectorAll('.youtube-card').length > 0,
    'Heart icons': !!document.querySelectorAll('[class*="heart"]').length > 0,
    'Edit buttons': !!document.querySelectorAll('[class*="pencil"]').length > 0,
    'Delete buttons': !!document.querySelectorAll('[class*="trash"]').length > 0
  };
  
  console.log('UI elements status:', elements);
  return Object.values(elements).every(Boolean);
}

// Test 5: Check like/unlike functionality
function testLikeFunctionality() {
  console.log('✅ Test 5: Checking like functionality...');
  
  const heartButtons = document.querySelectorAll('button[class*="heart"], button[class*="Heart"]');
  console.log(`Found ${heartButtons.length} heart buttons`);
  
  if (heartButtons.length > 0) {
    console.log('✅ Like buttons found - functionality should be available');
    return true;
  } else {
    console.log('❌ No heart buttons found');
    return false;
  }
}

// Test 6: Check edit functionality
function testEditFunctionality() {
  console.log('✅ Test 6: Checking edit functionality...');
  
  const editButtons = document.querySelectorAll('button[class*="pencil"], button[class*="Pencil"]');
  console.log(`Found ${editButtons.length} edit buttons`);
  
  if (editButtons.length > 0) {
    console.log('✅ Edit buttons found - functionality should be available');
    return true;
  } else {
    console.log('❌ No edit buttons found');
    return false;
  }
}

// Test 7: Check delete functionality
function testDeleteFunctionality() {
  console.log('✅ Test 7: Checking delete functionality...');
  
  const deleteButtons = document.querySelectorAll('button[class*="trash"], button[class*="Trash"]');
  console.log(`Found ${deleteButtons.length} delete buttons`);
  
  if (deleteButtons.length > 0) {
    console.log('✅ Delete buttons found - functionality should be available');
    return true;
  } else {
    console.log('❌ No delete buttons found');
    return false;
  }
}

// Test 8: Check note card structure
function testNoteCardStructure() {
  console.log('✅ Test 8: Checking note card structure...');
  
  const noteCards = document.querySelectorAll('.youtube-card');
  console.log(`Found ${noteCards.length} note cards`);
  
  if (noteCards.length > 0) {
    const firstCard = noteCards[0];
    const hasTimestamp = !!firstCard.querySelector('[class*="bg-purple"]');
    const hasNoteText = !!firstCard.querySelector('p');
    const hasActionButtons = !!firstCard.querySelector('button');
    
    console.log('Note card structure:', {
      hasTimestamp,
      hasNoteText,
      hasActionButtons
    });
    
    return hasTimestamp && hasNoteText && hasActionButtons;
  } else {
    console.log('❌ No note cards found');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all dashboard functionality tests...\n');
  
  const tests = [
    { name: 'Component Loading', fn: testComponentLoading },
    { name: 'API Endpoints', fn: testAPIEndpoints },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'UI Elements', fn: testUIElements },
    { name: 'Like Functionality', fn: testLikeFunctionality },
    { name: 'Edit Functionality', fn: testEditFunctionality },
    { name: 'Delete Functionality', fn: testDeleteFunctionality },
    { name: 'Note Card Structure', fn: testNoteCardStructure }
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
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
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
    console.log('🎉 All tests passed! Dashboard functionalities should be working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.');
  }
  
  return results;
}

// Manual test functions for interactive testing

// Test like/unlike manually
function testLikeToggle() {
  console.log('🧪 Manual test: Like/Unlike functionality');
  console.log('1. Find a heart icon on a note card');
  console.log('2. Click the heart icon');
  console.log('3. Verify it changes from outline to solid (or vice versa)');
  console.log('4. Check browser network tab for API call');
  console.log('5. Refresh page and verify like state persists');
}

// Test edit note manually
function testEditNote() {
  console.log('🧪 Manual test: Edit Note functionality');
  console.log('1. Find a note card with a pencil/edit icon');
  console.log('2. Click the edit button');
  console.log('3. Verify note becomes editable');
  console.log('4. Modify the text');
  console.log('5. Click the check mark to save');
  console.log('6. Verify changes are saved');
  console.log('7. Try clicking X to cancel');
}

// Test delete note manually
function testDeleteNote() {
  console.log('🧪 Manual test: Delete Note functionality');
  console.log('1. Find a note card with a trash/delete icon');
  console.log('2. Click the delete button');
  console.log('3. Verify confirmation dialog appears');
  console.log('4. Confirm deletion');
  console.log('5. Verify note is removed from list');
}

// Test delete bookmark card manually
function testDeleteBookmarkCard() {
  console.log('🧪 Manual test: Delete Bookmark Card functionality');
  console.log('1. Go to main dashboard');
  console.log('2. Find a video card with delete button');
  console.log('3. Click the delete button');
  console.log('4. Verify confirmation dialog appears');
  console.log('5. Confirm deletion');
  console.log('6. Verify video card is removed from dashboard');
}

// Export functions for manual testing
window.dashboardTests = {
  runAllTests,
  testLikeToggle,
  testEditNote,
  testDeleteNote,
  testDeleteBookmarkCard
};

console.log('📝 Test functions loaded. Run dashboardTests.runAllTests() to start automated tests.');
console.log('📝 Manual test functions available:');
console.log('- dashboardTests.testLikeToggle()');
console.log('- dashboardTests.testEditNote()');
console.log('- dashboardTests.testDeleteNote()');
console.log('- dashboardTests.testDeleteBookmarkCard()'); 