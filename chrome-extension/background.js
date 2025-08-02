// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveNote') {
    handleSaveNote(request, sender, sendResponse);
    return true; // Required for async sendResponse
  }
  
  if (request.action === 'syncTokensFromDashboard') {
    handleSyncTokensFromDashboard(sendResponse);
    return true; // Required for async sendResponse
  }
  
  if (request.action === 'clearTokens') {
    handleClearTokens(sendResponse);
    return true; // Required for async sendResponse
  }
  
  if (request.action === 'checkDashboardLogout') {
    handleCheckDashboardLogout(sendResponse);
    return true; // Required for async sendResponse
  }
});

async function handleSyncTokensFromDashboard(sendResponse) {
  try {
    console.log('🔍 Background: Starting token sync from dashboard...');
    
    // Find the dashboard tab
    const tabs = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
    
    if (tabs.length === 0) {
      console.log('❌ Background: No dashboard tab found');
      sendResponse({ success: false, error: 'Dashboard not found' });
      return;
    }
    
    const dashboardTab = tabs[0];
    console.log('🔍 Background: Found dashboard tab:', dashboardTab.id);
    
    // Execute script to get tokens from localStorage
    const results = await chrome.scripting.executeScript({
      target: { tabId: dashboardTab.id },
      func: () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        return { accessToken, refreshToken };
      }
    });
    
    if (!results || !results[0] || !results[0].result) {
      console.log('❌ Background: Failed to execute script or no results');
      sendResponse({ success: false, error: 'Failed to get tokens from dashboard' });
      return;
    }
    
    const { accessToken, refreshToken } = results[0].result;
    
    console.log('🔍 Background: Tokens from localStorage:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken ? accessToken.length : 0,
      refreshTokenLength: refreshToken ? refreshToken.length : 0
    });
    
    if (!accessToken || !refreshToken) {
      console.log('❌ Background: No tokens found in dashboard localStorage');
      sendResponse({ success: false, error: 'No tokens found in dashboard' });
      return;
    }
    
    // Store tokens in chrome.storage.local
    await chrome.storage.local.set({
      accessToken: accessToken,
      refreshToken: refreshToken
    });
    
    console.log('✅ Background: Tokens synced successfully');
    
    // Verify tokens were stored correctly
    const storedTokens = await chrome.storage.local.get(['accessToken', 'refreshToken']);
    console.log('🔍 Background: Verification after storing:', {
      hasAccessToken: !!storedTokens.accessToken,
      hasRefreshToken: !!storedTokens.refreshToken,
      accessTokenLength: storedTokens.accessToken ? storedTokens.accessToken.length : 0,
      refreshTokenLength: storedTokens.refreshToken ? storedTokens.refreshToken.length : 0
    });
    
    sendResponse({ success: true });
    
  } catch (error) {
    console.error('❌ Background: Token sync error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearTokens(sendResponse) {
  try {
    console.log('🔍 Background: Clearing tokens...');
    await chrome.storage.local.remove(['accessToken', 'refreshToken']);
    console.log('✅ Background: Tokens cleared successfully');
    sendResponse({ success: true });
  } catch (error) {
    console.error('❌ Background: Clear tokens error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCheckDashboardLogout(sendResponse) {
  try {
    console.log('🔍 Background: Checking dashboard logout status...');
    
    // Find the dashboard tab
    const tabs = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
    
    if (tabs.length === 0) {
      console.log('❌ Background: No dashboard tab found for logout check');
      sendResponse({ success: false, error: 'Dashboard not found', loggedOut: false });
      return;
    }
    
    const dashboardTab = tabs[0];
    console.log('🔍 Background: Found dashboard tab for logout check:', dashboardTab.id);
    
    // Execute script to check if tokens exist in localStorage
    const results = await chrome.scripting.executeScript({
      target: { tabId: dashboardTab.id },
      func: () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        return { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          accessTokenLength: accessToken ? accessToken.length : 0,
          refreshTokenLength: refreshToken ? refreshToken.length : 0
        };
      }
    });
    
    if (!results || !results[0] || !results[0].result) {
      console.log('❌ Background: Failed to execute script for logout check');
      sendResponse({ success: false, error: 'Failed to check dashboard tokens', loggedOut: false });
      return;
    }
    
    const { hasAccessToken, hasRefreshToken } = results[0].result;
    const loggedOut = !hasAccessToken || !hasRefreshToken;
    
    console.log('🔍 Background: Dashboard token status:', {
      hasAccessToken,
      hasRefreshToken,
      loggedOut
    });
    
    sendResponse({ 
      success: true, 
      loggedOut,
      dashboardTokens: {
        hasAccessToken,
        hasRefreshToken
      }
    });
    
  } catch (error) {
    console.error('❌ Background: Dashboard logout check error:', error);
    sendResponse({ success: false, error: error.message, loggedOut: false });
  }
}

async function handleSaveNote(request, sender, sendResponse) {
  try {
    const tab = sender.tab;
    if (!tab || !tab.url.includes('youtube.com/watch')) {
      sendResponse({ success: false, error: 'Not a YouTube video tab' });
      return;
    }

    // Execute script in the tab
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: saveNoteInPage,
      args: [request.note, request.captureScreenshot]
    });

    sendResponse(result[0].result);
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function saveNoteInPage(note, captureScreenshot) {
  return new Promise(async (resolve) => {
    const video = document.querySelector('video');
    const title = document.title.replace(' - YouTube', '');
    const url = new URL(window.location.href);
    const videoId = url.searchParams.get('v');
    
    let screenshot = null;
    if (captureScreenshot && video) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      screenshot = canvas.toDataURL('image/png');
    }

    // Get tokens from storage
    const tokens = await chrome.storage.local.get(['accessToken', 'refreshToken']);
    
    if (!tokens.accessToken) {
      resolve({ success: false, error: 'No access token available' });
      return;
    }
    
    fetch('http://localhost:5000/bookmark', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`
      },
      body: JSON.stringify({
        videoId,
        videoTitle: title,
        timestamp: Math.floor(video.currentTime),
        note,
        screenshot
      })
    })
    .then(res => res.ok ? resolve({ success: true }) : 
      resolve({ success: false, error: `Server error: ${res.status}` }))
    .catch(err => resolve({ success: false, error: err.message }));
  });
}