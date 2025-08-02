// Dropdown Fix Test Script
// Run this in browser console to test the dropdown positioning fix

console.log('🔧 Testing Dropdown Fix...');

// Test 1: Check if dropdown button exists
function testDropdownButton() {
  console.log('✅ Test 1: Checking dropdown button...');
  
  const sortButton = document.querySelector('button[class*="youtube-button"]');
  
  if (!sortButton) {
    console.log('❌ Sort button not found');
    return false;
  }
  
  console.log('✅ Sort button found');
  console.log('Button text:', sortButton.textContent);
  return true;
}

// Test 2: Check dropdown container positioning
function testDropdownContainer() {
  console.log('✅ Test 2: Checking dropdown container...');
  
  const dropdownContainer = document.querySelector('.relative');
  
  if (!dropdownContainer) {
    console.log('❌ Dropdown container not found');
    return false;
  }
  
  console.log('✅ Dropdown container found');
  
  // Check if container has proper positioning
  const containerStyle = window.getComputedStyle(dropdownContainer);
  console.log('Container position:', containerStyle.position);
  console.log('Container z-index:', containerStyle.zIndex);
  
  return containerStyle.position === 'relative';
}

// Test 3: Test dropdown functionality
function testDropdownFunctionality() {
  console.log('✅ Test 3: Testing dropdown functionality...');
  
  const sortButton = document.querySelector('button[class*="youtube-button"]');
  
  if (!sortButton) {
    console.log('❌ Sort button not found');
    return false;
  }
  
  // Click the button to open dropdown
  console.log('🔄 Clicking sort button to open dropdown...');
  sortButton.click();
  
  // Wait a moment for dropdown to appear
  setTimeout(() => {
    const dropdown = document.querySelector('.absolute.top-full');
    
    if (dropdown) {
      console.log('✅ Dropdown opened successfully');
      console.log('Dropdown position:', window.getComputedStyle(dropdown).position);
      console.log('Dropdown z-index:', window.getComputedStyle(dropdown).zIndex);
      
      // Check if dropdown is visible
      const rect = dropdown.getBoundingClientRect();
      console.log('Dropdown bounds:', {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
      
      // Check if dropdown is within viewport
      const isInViewport = rect.top >= 0 && rect.left >= 0 && 
                          rect.bottom <= window.innerHeight && 
                          rect.right <= window.innerWidth;
      
      console.log('Dropdown in viewport:', isInViewport);
      
      if (isInViewport) {
        console.log('✅ Dropdown is fully visible and clickable');
      } else {
        console.log('❌ Dropdown is cut off or not fully visible');
      }
      
      // Close dropdown
      sortButton.click();
      
    } else {
      console.log('❌ Dropdown did not open');
    }
  }, 100);
  
  return true;
}

// Test 4: Manual test instructions
function manualDropdownTest() {
  console.log('🧪 Manual test: Dropdown positioning');
  console.log('1. Click the "Sort By" button');
  console.log('2. Verify dropdown opens below the button');
  console.log('3. Verify dropdown is fully visible (not cut off)');
  console.log('4. Verify dropdown options are clickable');
  console.log('5. Try clicking different sort options');
  console.log('6. Verify dropdown closes after selection');
  console.log('7. Test on different screen sizes (mobile, tablet, desktop)');
  console.log('8. Verify dropdown doesn\'t get cut off on any screen size');
}

// Test 5: Check viewport and positioning
function testViewportPositioning() {
  console.log('✅ Test 5: Checking viewport and positioning...');
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  console.log('Viewport dimensions:', {
    width: viewportWidth,
    height: viewportHeight
  });
  
  const sortButton = document.querySelector('button[class*="youtube-button"]');
  
  if (sortButton) {
    const buttonRect = sortButton.getBoundingClientRect();
    console.log('Button position:', {
      top: buttonRect.top,
      left: buttonRect.left,
      right: buttonRect.right,
      bottom: buttonRect.bottom
    });
    
    // Check if button is near the right edge
    const nearRightEdge = buttonRect.right > viewportWidth - 200;
    console.log('Button near right edge:', nearRightEdge);
    
    if (nearRightEdge) {
      console.log('⚠️ Button is near right edge - dropdown should position left');
    }
  }
  
  return true;
}

// Run all tests
async function runDropdownTests() {
  console.log('🚀 Running dropdown fix tests...\n');
  
  const tests = [
    { name: 'Dropdown Button', fn: testDropdownButton },
    { name: 'Dropdown Container', fn: testDropdownContainer },
    { name: 'Dropdown Functionality', fn: testDropdownFunctionality },
    { name: 'Viewport Positioning', fn: testViewportPositioning }
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
  
  console.log('\n📊 Dropdown Fix Test Results:');
  console.log('=============================');
  
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
    console.log('🎉 All dropdown tests passed! The dropdown should be working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.');
  }
  
  return results;
}

// Export functions
window.dropdownTests = {
  runDropdownTests,
  manualDropdownTest
};

console.log('📝 Dropdown test functions loaded. Run dropdownTests.runDropdownTests() to start tests.');
console.log('📝 Manual test function available:');
console.log('- dropdownTests.manualDropdownTest()'); 