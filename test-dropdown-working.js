// Test if dropdown is working
// Run this in browser console

console.log('🧪 Testing Dropdown Functionality...');

// Step 1: Check if we can find the button
const button = document.querySelector('button[class*="youtube-button"]');
console.log('1. Button found:', !!button);

if (button) {
  console.log('   Button text:', button.textContent);
  
  // Step 2: Click the button
  console.log('2. Clicking button...');
  button.click();
  
  // Step 3: Wait and check for dropdown
  setTimeout(() => {
    const dropdown = document.querySelector('.absolute.right-0');
    console.log('3. Dropdown found after click:', !!dropdown);
    
    if (dropdown) {
      console.log('   ✅ Dropdown is working!');
      console.log('   Dropdown text:', dropdown.textContent);
      
      // Check if options are visible
      const options = dropdown.querySelectorAll('button');
      console.log('   Options found:', options.length);
      options.forEach((opt, i) => {
        console.log(`   Option ${i}:`, opt.textContent);
      });
      
      // Close dropdown
      button.click();
      
    } else {
      console.log('   ❌ Dropdown not found');
      
      // Check if there are any absolute elements
      const allAbsolute = document.querySelectorAll('.absolute');
      console.log('   All absolute elements:', allAbsolute.length);
      
      if (allAbsolute.length > 0) {
        allAbsolute.forEach((el, i) => {
          console.log(`   Element ${i}:`, el.className, el.textContent.substring(0, 50));
        });
      }
    }
  }, 100);
  
} else {
  console.log('❌ No button found');
}

// Alternative: Try to find any dropdown-like elements
console.log('🔍 Looking for any dropdown elements...');
const allDropdowns = document.querySelectorAll('[class*="dropdown"], [class*="menu"], [class*="popup"]');
console.log('Potential dropdown elements:', allDropdowns.length); 