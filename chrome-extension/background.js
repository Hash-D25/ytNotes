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
    // Find the dashboard tab
    const tabs = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
    
    if (tabs.length === 0) {
      sendResponse({ success: false, error: 'Dashboard not found' });
      return;
    }
    
    const dashboardTab = tabs[0];
    
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
      sendResponse({ success: false, error: 'Failed to get tokens from dashboard' });
      return;
    }
    
    const { accessToken, refreshToken } = results[0].result;
    
    if (!accessToken || !refreshToken) {
      sendResponse({ success: false, error: 'No tokens found in dashboard' });
      return;
    }
    
    // Store tokens in chrome.storage.local
    await chrome.storage.local.set({
      accessToken: accessToken,
      refreshToken: refreshToken
    });
    
    sendResponse({ success: true });
    
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleClearTokens(sendResponse) {
  try {
    await chrome.storage.local.remove(['accessToken', 'refreshToken']);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleCheckDashboardLogout(sendResponse) {
  try {
    
    // Find the dashboard tab
    const tabs = await chrome.tabs.query({ url: 'http://localhost:5173/*' });
    
    if (tabs.length === 0) {
      sendResponse({ success: false, error: 'Dashboard not found', loggedOut: false });
      return;
    }
    
    const dashboardTab = tabs[0];
    
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
      sendResponse({ success: false, error: 'Failed to check dashboard tokens', loggedOut: false });
      return;
    }
    
    const { hasAccessToken, hasRefreshToken } = results[0].result;
    const loggedOut = !hasAccessToken || !hasRefreshToken;
    
    sendResponse({ 
      success: true, 
      loggedOut,
      dashboardTokens: {
        hasAccessToken,
        hasRefreshToken
      }
    });
    
  } catch (error) {
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