// Wrap everything in a function that runs when the popup loads
document.addEventListener('DOMContentLoaded', function() {
  const saveBtn = document.getElementById('saveBtn');
  const noteInput = document.getElementById('note');
  const captureScreenshot = document.getElementById('captureScreenshot');
  const statusEl = document.getElementById('status');
  const syncBtn = document.getElementById('syncBtn');
  const testBtn = document.getElementById('testBtn');
  const manualAccessToken = document.getElementById('manualAccessToken');
  const manualRefreshToken = document.getElementById('manualRefreshToken');
  const manualTokenBtn = document.getElementById('manualTokenBtn');
  const autoStatusEl = document.getElementById('autoStatus');
  const debugBtn = document.getElementById('debugBtn');

  // Clear any previous state
  noteInput.value = '';
  statusEl.textContent = '';
  statusEl.className = 'status';
  saveBtn.disabled = false;

  // Check auto-detection status
  async function checkAutoDetectionStatus() {
    try {
      // Check if we have tokens
      const storedTokens = await new Promise((resolve) => {
        chrome.storage.local.get(['accessToken', 'refreshToken'], resolve);
      });
      
      console.log('🔍 Popup: Current stored tokens:', {
        hasAccessToken: !!storedTokens.accessToken,
        hasRefreshToken: !!storedTokens.refreshToken,
        accessTokenLength: storedTokens.accessToken ? storedTokens.accessToken.length : 0,
        refreshTokenLength: storedTokens.refreshToken ? storedTokens.refreshToken.length : 0
      });
      
      if (storedTokens.accessToken) {
        // Test if tokens are valid
        const response = await fetch('http://localhost:5000/auth/status', {
          headers: { 'Authorization': `Bearer ${storedTokens.accessToken}` }
        });
        
        if (response.ok) {
          autoStatusEl.textContent = '✅ Auto-detection working - User logged in';
          autoStatusEl.className = 'status success';
        } else {
          autoStatusEl.textContent = '⚠️ Tokens found but expired - Try sync';
          autoStatusEl.className = 'status error';
        }
      } else {
        // No tokens found
        autoStatusEl.textContent = '❌ No tokens found - Login to dashboard first';
        autoStatusEl.className = 'status error';
      }
    } catch (error) {
      console.error('Auto-detection status check failed:', error);
      autoStatusEl.textContent = '❌ Status check failed';
      autoStatusEl.className = 'status error';
    }
  }

  // Check status on popup open
  checkAutoDetectionStatus();

  // Debug button handler
  debugBtn.onclick = function() {
    debugTokenStorage();
  };

  // Manual token input functionality
  manualTokenBtn.onclick = async function() {
    const accessToken = manualAccessToken.value.trim();
    const refreshToken = manualRefreshToken.value.trim();
    
    if (!accessToken) {
      statusEl.textContent = 'Please enter an access token.';
      statusEl.className = 'status error';
      return;
    }
    
    this.disabled = true;
    statusEl.textContent = 'Setting tokens manually...';
    statusEl.className = 'status info';
    
    try {
      await new Promise((resolve) => {
        chrome.storage.local.set({
          accessToken: accessToken,
          refreshToken: refreshToken
        }, () => {
          console.log('📋 Manual tokens stored in chrome.storage.local');
          resolve();
        });
      });
      
      statusEl.textContent = 'Tokens set manually! Try "Test Extension" now.';
      statusEl.className = 'status success';
      
      // Clear the input fields
      manualAccessToken.value = '';
      manualRefreshToken.value = '';
      
    } catch (error) {
      console.error('❌ Manual token error:', error);
      statusEl.textContent = 'Failed to set tokens manually.';
      statusEl.className = 'status error';
    } finally {
      this.disabled = false;
    }
  };

  // Test extension functionality
  testBtn.onclick = async function() {
    this.disabled = true;
    statusEl.textContent = 'Testing extension...';
    statusEl.className = 'status info';

    try {
      console.log('🧪 Starting extension test...');
      
      // Test 1: Check if we're on YouTube
      const tabs = await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve);
      });
      
      const currentTab = tabs[0];
      console.log('🧪 Current tab:', currentTab.url);
      
      if (!currentTab.url.includes('youtube.com/watch')) {
        statusEl.textContent = 'Please go to a YouTube video first.';
        statusEl.className = 'status error';
        this.disabled = false;
        return;
      }

      // Test 2: Check stored tokens
      const storedTokens = await new Promise((resolve) => {
        chrome.storage.local.get(['accessToken', 'refreshToken'], resolve);
      });
      
      console.log('🧪 Stored tokens:', {
        hasAccessToken: !!storedTokens.accessToken,
        hasRefreshToken: !!storedTokens.refreshToken
      });

      if (!storedTokens.accessToken) {
        statusEl.textContent = 'No tokens found. Try "Sync Tokens" first.';
        statusEl.className = 'status error';
        this.disabled = false;
        return;
      }

      // Test 3: Test backend connection
      try {
        const response = await fetch('http://localhost:5000/auth/status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${storedTokens.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('🧪 Backend auth test:', data);
          
          if (data.authenticated) {
            statusEl.textContent = '✅ Extension is working! You can save notes.';
            statusEl.className = 'status success';
          } else {
            statusEl.textContent = '❌ Token is invalid. Try logging in again.';
            statusEl.className = 'status error';
          }
        } else {
          statusEl.textContent = '❌ Backend connection failed.';
          statusEl.className = 'status error';
        }
      } catch (error) {
        console.error('🧪 Backend test error:', error);
        statusEl.textContent = '❌ Backend not reachable. Is the server running?';
        statusEl.className = 'status error';
      }

    } catch (error) {
      console.error('🧪 Test error:', error);
      statusEl.textContent = '❌ Test failed: ' + error.message;
      statusEl.className = 'status error';
    } finally {
      this.disabled = false;
    }
  };

  saveBtn.onclick = async function() {
    const note = noteInput.value.trim();
    
    if (!note) return;
    this.disabled = true;
    statusEl.textContent = 'Saving...';
    statusEl.className = 'status info';

    // Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url.includes('youtube.com/watch')) {
        statusEl.textContent = 'Not a YouTube video tab.';
        statusEl.className = 'status error';
        this.disabled = false;
        return;
      }

      // Inject script to get video info and capture screenshot
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (shouldCaptureScreenshot) => {
          const video = document.querySelector('video');
          const title = document.title.replace(' - YouTube', '');
          const url = new URL(window.location.href);
          const videoId = url.searchParams.get('v');
          
          let screenshot = null;
          if (shouldCaptureScreenshot && video) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            try {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              screenshot = canvas.toDataURL('image/png');
            } catch (error) {
              console.error('Failed to capture screenshot:', error);
            }
          }
          
          return {
            videoId,
            videoTitle: title,
            timestamp: video ? Math.floor(video.currentTime) : null,
            screenshot
          };
        },
        args: [captureScreenshot.checked]
      }, async (results) => {
        const info = results[0]?.result;
        if (!info || !info.videoId || info.timestamp === null) {
          statusEl.textContent = 'Could not get video info.';
          statusEl.className = 'status error';
          this.disabled = false;
          return;
        }

        // Send to backend with JWT authentication
        try {
          // Get stored tokens
          const { accessToken } = await new Promise((resolve) => {
            chrome.storage.local.get(['accessToken'], (result) => {
              resolve({ accessToken: result.accessToken });
            });
          });

          if (!accessToken) {
            statusEl.textContent = 'Please log in to the dashboard first.';
            statusEl.className = 'status error';
            this.disabled = false;
            return;
          }

          const requestBody = {
            videoId: info.videoId,
            videoTitle: info.videoTitle,
            timestamp: info.timestamp,
            note
          };

          if (info.screenshot) {
            requestBody.screenshot = info.screenshot;
          }

          const res = await fetch('http://localhost:5000/bookmark', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestBody)
          });

          if (res.ok) {
            statusEl.textContent = `Note saved!${info.screenshot ? ' Screenshot captured.' : ''}`;
            statusEl.className = 'status success';
            noteInput.value = '';
            
            // Close popup after 2 seconds
            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            statusEl.textContent = 'Error saving note.';
            statusEl.className = 'status error';
            this.disabled = false;
          }
        } catch (e) {
          statusEl.textContent = 'Network error.';
          statusEl.className = 'status error';
          this.disabled = false;
        }
      });
    });
  };

  // Sync tokens from dashboard using background script
  syncBtn.onclick = async function() {
    console.log('🔄 Sync button clicked - requesting token sync via background script...');
    this.disabled = true;
    statusEl.textContent = 'Syncing tokens...';
    statusEl.className = 'status info';

    try {
      // Use background script to sync tokens
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'syncTokensFromDashboard' }, (response) => {
          console.log('📋 Background script response:', response);
          resolve(response);
        });
      });

      if (response && response.success) {
        console.log('✅ Tokens synced successfully via background script');
        statusEl.textContent = 'Tokens synced successfully!';
        statusEl.className = 'status success';
        
        // Refresh auto-detection status
        checkAutoDetectionStatus();
      } else {
        console.log('❌ Token sync failed:', response?.error);
        statusEl.textContent = `Sync failed: ${response?.error || 'Unknown error'}`;
        statusEl.className = 'status error';
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      statusEl.textContent = `Sync error: ${error.message}`;
      statusEl.className = 'status error';
    } finally {
      this.disabled = false;
    }
  };

  // Debug function to test token storage
  window.debugTokenStorage = async function() {
    console.log('🔍 Debug: Testing token storage...');
    
    // Test storing a dummy token
    const testToken = 'test-access-token-' + Date.now();
    const testRefreshToken = 'test-refresh-token-' + Date.now();
    
    try {
      await new Promise((resolve) => {
        chrome.storage.local.set({
          accessToken: testToken,
          refreshToken: testRefreshToken
        }, () => {
          console.log('🔍 Debug: Test tokens stored');
          resolve();
        });
      });
      
      // Verify storage
      const stored = await new Promise((resolve) => {
        chrome.storage.local.get(['accessToken', 'refreshToken'], (result) => {
          console.log('🔍 Debug: Stored tokens verification:', {
            hasAccessToken: !!result.accessToken,
            hasRefreshToken: !!result.refreshToken,
            accessTokenLength: result.accessToken ? result.accessToken.length : 0,
            refreshTokenLength: result.refreshToken ? result.refreshToken.length : 0
          });
          resolve(result);
        });
      });
      
      if (stored.accessToken === testToken) {
        console.log('✅ Debug: Token storage working correctly');
        statusEl.textContent = 'Debug: Token storage working';
        statusEl.className = 'status success';
      } else {
        console.log('❌ Debug: Token storage verification failed');
        statusEl.textContent = 'Debug: Token storage failed';
        statusEl.className = 'status error';
      }
      
      // Clean up test tokens
      await new Promise((resolve) => {
        chrome.storage.local.remove(['accessToken', 'refreshToken'], () => {
          console.log('🔍 Debug: Test tokens cleaned up');
          resolve();
        });
      });
      
    } catch (error) {
      console.error('❌ Debug: Token storage test failed:', error);
      statusEl.textContent = 'Debug: Token storage test failed';
      statusEl.className = 'status error';
    }
  };
});