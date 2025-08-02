// Debug Dropdown Script
// Run this in browser console to debug the dropdown issue

console.log('🔍 Debugging Dropdown Issue...');

// Function to check if dropdown exists and is visible
function debugDropdown() {
  console.log('=== DROPDOWN DEBUG ===');
  
  // 1. Check if button exists
  const button = document.querySelector('button[class*="youtube-button"]');
  console.log('1. Button found:', !!button);
  if (button) {
    console.log('   Button text:', button.textContent);
    console.log('   Button classes:', button.className);
  }
  
  // 2. Check if dropdown container exists
  const container = document.querySelector('.relative');
  console.log('2. Container found:', !!container);
  if (container) {
    console.log('   Container classes:', container.className);
  }
  
  // 3. Check if dropdown is open (click button first)
  console.log('3. Clicking button to open dropdown...');
  if (button) {
    button.click();
    
    setTimeout(() => {
      // 4. Check for dropdown element
      const dropdown = document.querySelector('.absolute.right-0');
      console.log('4. Dropdown found:', !!dropdown);
      
      if (dropdown) {
        console.log('   Dropdown classes:', dropdown.className);
        console.log('   Dropdown style:', dropdown.style.cssText);
        
        // 5. Check dropdown visibility
        const rect = dropdown.getBoundingClientRect();
        console.log('5. Dropdown bounds:', rect);
        console.log('   Width:', rect.width, 'Height:', rect.height);
        console.log('   Visible:', rect.width > 0 && rect.height > 0);
        
        // 6. Check computed styles
        const computedStyle = window.getComputedStyle(dropdown);
        console.log('6. Computed styles:', {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          opacity: computedStyle.opacity,
          position: computedStyle.position,
          zIndex: computedStyle.zIndex
        });
        
        // 7. Check parent containers for overflow issues
        let parent = dropdown.parentElement;
        let level = 0;
        while (parent && level < 5) {
          const parentStyle = window.getComputedStyle(parent);
          console.log(`7. Parent ${level}:`, {
            tagName: parent.tagName,
            className: parent.className,
            overflow: parentStyle.overflow,
            position: parentStyle.position,
            zIndex: parentStyle.zIndex
          });
          parent = parent.parentElement;
          level++;
        }
        
        // 8. Check dropdown options
        const options = dropdown.querySelectorAll('button');
        console.log('8. Dropdown options:', options.length);
        options.forEach((opt, index) => {
          console.log(`   Option ${index}:`, opt.textContent);
        });
        
      } else {
        console.log('❌ Dropdown not found after clicking');
        
        // Check for any absolute positioned elements
        const allAbsolute = document.querySelectorAll('.absolute');
        console.log('   All absolute elements:', allAbsolute.length);
        allAbsolute.forEach((el, index) => {
          console.log(`   Element ${index}:`, el.className, el.textContent);
        });
      }
      
      // Close dropdown
      if (button) button.click();
      
    }, 100);
  }
}

// Function to force dropdown visibility
function forceDropdownVisible() {
  console.log('🔧 Forcing dropdown visibility...');
  
  const dropdown = document.querySelector('.absolute.right-0');
  if (dropdown) {
    dropdown.style.display = 'block';
    dropdown.style.visibility = 'visible';
    dropdown.style.opacity = '1';
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '9999';
    dropdown.style.backgroundColor = 'rgb(31, 41, 55)';
    dropdown.style.border = '1px solid rgb(55, 65, 81)';
    dropdown.style.borderRadius = '8px';
    dropdown.style.padding = '4px 0';
    dropdown.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
    
    console.log('✅ Forced dropdown styles applied');
  } else {
    console.log('❌ No dropdown found to force visibility');
  }
}

// Function to check React state
function checkReactState() {
  console.log('🔍 Checking React component state...');
  
  // Look for React internal properties
  const button = document.querySelector('button[class*="youtube-button"]');
  if (button) {
    const reactKey = Object.keys(button).find(key => key.startsWith('__reactProps$'));
    if (reactKey) {
      console.log('✅ React props found on button');
      console.log('   onClick handler:', !!button[reactKey].onClick);
    }
  }
}

// Run all debug functions
function runDebug() {
  debugDropdown();
  setTimeout(() => checkReactState(), 200);
  setTimeout(() => forceDropdownVisible(), 500);
}

// Export functions
window.debugDropdown = debugDropdown;
window.forceDropdownVisible = forceDropdownVisible;
window.checkReactState = checkReactState;
window.runDebug = runDebug;

console.log('📝 Debug functions loaded:');
console.log('- debugDropdown() - Check dropdown state');
console.log('- forceDropdownVisible() - Force dropdown to show');
console.log('- checkReactState() - Check React component state');
console.log('- runDebug() - Run all debug functions'); 