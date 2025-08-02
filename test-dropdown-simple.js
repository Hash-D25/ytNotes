// Simple Dropdown Test
// Run this in browser console to test dropdown

console.log('🔧 Simple Dropdown Test...');

// Test 1: Check if button exists and is clickable
function testButton() {
  console.log('✅ Test 1: Checking button...');
  
  const button = document.querySelector('button[class*="youtube-button"]');
  
  if (!button) {
    console.log('❌ Button not found');
    return false;
  }
  
  console.log('✅ Button found');
  console.log('Button text:', button.textContent);
  console.log('Button classes:', button.className);
  
  return true;
}

// Test 2: Click button and check dropdown
function testDropdown() {
  console.log('✅ Test 2: Testing dropdown...');
  
  const button = document.querySelector('button[class*="youtube-button"]');
  
  if (!button) {
    console.log('❌ Button not found');
    return false;
  }
  
  console.log('🔄 Clicking button...');
  button.click();
  
  // Wait for dropdown to appear
  setTimeout(() => {
    const dropdown = document.querySelector('.absolute.top-full');
    
    if (dropdown) {
      console.log('✅ Dropdown found!');
      console.log('Dropdown classes:', dropdown.className);
      console.log('Dropdown style:', dropdown.style.cssText);
      
      // Check dropdown options
      const options = dropdown.querySelectorAll('button');
      console.log(`Found ${options.length} options:`, Array.from(options).map(opt => opt.textContent));
      
      // Check if dropdown is visible
      const rect = dropdown.getBoundingClientRect();
      console.log('Dropdown bounds:', rect);
      
      if (rect.width > 0 && rect.height > 0) {
        console.log('✅ Dropdown is visible and has size');
      } else {
        console.log('❌ Dropdown has no size');
      }
      
      // Close dropdown
      button.click();
      
    } else {
      console.log('❌ Dropdown not found after clicking');
      
      // Check if there are any absolute positioned elements
      const absoluteElements = document.querySelectorAll('.absolute');
      console.log('All absolute elements:', absoluteElements.length);
      
      absoluteElements.forEach((el, index) => {
        console.log(`Element ${index}:`, el.className, el.style.cssText);
      });
    }
  }, 100);
  
  return true;
}

// Test 3: Check for CSS issues
function testCSS() {
  console.log('✅ Test 3: Checking CSS...');
  
  const button = document.querySelector('button[class*="youtube-button"]');
  const container = button?.closest('.relative');
  
  if (container) {
    console.log('✅ Container found');
    console.log('Container classes:', container.className);
    console.log('Container style:', container.style.cssText);
    
    const computedStyle = window.getComputedStyle(container);
    console.log('Container computed style:', {
      position: computedStyle.position,
      zIndex: computedStyle.zIndex,
      overflow: computedStyle.overflow
    });
  }
  
  return true;
}

// Run all tests
function runSimpleTests() {
  console.log('🚀 Running simple dropdown tests...\n');
  
  testButton();
  setTimeout(() => testDropdown(), 500);
  setTimeout(() => testCSS(), 1000);
}

// Export
window.simpleDropdownTest = runSimpleTests;

console.log('📝 Simple dropdown test loaded. Run simpleDropdownTest() to test.'); 