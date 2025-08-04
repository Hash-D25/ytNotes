// Helper functions to manage user authentication tokens
async function getStoredTokens() {
  try {
    const result = await chrome.storage.local.get(['accessToken', 'refreshToken']);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    };
  } catch (error) {
    return { accessToken: null, refreshToken: null };
  }
}

async function storeTokens(accessToken, refreshToken) {
  try {
    // Save the tokens securely in the extension's storage
    const tokensToStore = {
      accessToken: accessToken,
      refreshToken: refreshToken
    };
    
    await chrome.storage.local.set(tokensToStore);
    
  } catch (error) {
    throw error; 
  }
}

async function clearStoredTokens() {
  try {
    await chrome.storage.local.remove(['accessToken', 'refreshToken']);
  } catch (error) {
    // handle any storage errors
  }
}

// Make API calls with automatic token refresh when needed
async function fetchWithAuth(url, options = {}) {
  try {
    const { accessToken } = await getStoredTokens();
    
    if (!accessToken) {
      throw new Error('No access token available');
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    // If the token expired, try to get a fresh one
    if (response.status === 401) {
      const { refreshToken } = await getStoredTokens();
      
      if (refreshToken) {
        const refreshResponse = await fetch('https://ytnotes-server.onrender.com/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResponse.ok) {
          const { accessToken: newAccessToken } = await refreshResponse.json();
          await storeTokens(newAccessToken, refreshToken);
          
          // Try the original request again with the new token
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newAccessToken}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          // Token refresh didn't work, so clear everything and start fresh
          await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'clearTokens' }, (response) => {
              if (response && response.success) {
                // Tokens cleared successfully
              } else {
                // Something went wrong clearing tokens
              }
              resolve();
            });
          });
          throw new Error('Token refresh failed');
        }
      } else {
        // No refresh token available, clear everything
        await new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'clearTokens' }, (response) => {
            if (response && response.success) {
              // Tokens cleared successfully
            } else {
              // Something went wrong clearing tokens
            }
            resolve();
          });
        });
        throw new Error('No refresh token available');
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
}

// Get tokens from the dashboard tab and save them in the extension
async function syncTokensFromDashboard() {
  try {
    // Ask the background script to grab tokens from the dashboard
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'syncTokensFromDashboard' }, (response) => {
        if (response && response.success) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  } catch (error) {
    return false;
  }
}

// Automatically detect when user logs in and sync their tokens
async function detectLoginAndSync() {
  try {
    // Since we're on YouTube, try to grab tokens from the dashboard tab
    const synced = await syncTokensFromDashboard();
    
    if (synced) {
      // Once we have tokens, show the bookmark markers right away
      setTimeout(() => {
        addBookmarkMarkers();
      }, 1000); // Give it a second to settle
      
      // Also try again after 3 seconds just to be sure
      setTimeout(() => {
        addBookmarkMarkers();
      }, 3000);
      
      // Start watching for logout right after successful login
      setTimeout(async () => {
        const loggedOut = await detectLogout();
        if (loggedOut) {
          // User logged out, but we already handled it
        }
      }, 2000); // Check after 2 seconds
    }
    
    return synced;
  } catch (error) {
    return false;
  }
}

// Watch for when the user logs out and clean up accordingly
async function detectLogout() {
  try {
    // First check if the dashboard cleared the tokens (main way we detect logout)
    const dashboardLogout = await checkDashboardLogout();
    if (dashboardLogout) {
      // Clear our stored tokens too
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'clearTokens' }, (response) => {
          if (response && response.success) {
            // Tokens cleared successfully
          } else {
            // Something went wrong
          }
          resolve();
        });
      });
      
      // Remove all the bookmark markers from the timeline
      const existingMarkers = document.querySelectorAll('.yt-bookmark-marker');
      existingMarkers.forEach(marker => marker.remove());
      
      // Reset the show markers button to its default state
      const showMarkersBtn = document.getElementById('yt-show-markers-btn');
      if (showMarkersBtn) {
        showMarkersBtn.textContent = '📍';
        showMarkersBtn.title = 'Show Timeline Markers';
      }
      
      // Update the dashboard button to show logged out state
      const dashboardBtn = document.getElementById('yt-dashboard-btn');
      if (dashboardBtn) {
        dashboardBtn.title = 'ytNotes Dashboard (Not Logged In)';
        dashboardBtn.style.opacity = '0.6';
      }
      
      return true;
    }
    
    // Secondary check: Check if our stored tokens are still valid with backend
    const { accessToken } = await getStoredTokens();
    if (accessToken) {
      try {
        const response = await fetch('https://ytnotes-server.onrender.com/auth/status', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) {
          // Use background script to clear tokens
          await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'clearTokens' }, (response) => {
              if (response && response.success) {
              } else {
              }
              resolve();
            });
          });
          
          // Immediately remove markers after token expiration
          const existingMarkers = document.querySelectorAll('.yt-bookmark-marker');
          existingMarkers.forEach(marker => marker.remove());
          
          // Update show markers button state
          const showMarkersBtn = document.getElementById('yt-show-markers-btn');
          if (showMarkersBtn) {
            showMarkersBtn.textContent = '📍';
            showMarkersBtn.title = 'Show Timeline Markers';
          }
          
          // Update dashboard button appearance
          const dashboardBtn = document.getElementById('yt-dashboard-btn');
          if (dashboardBtn) {
            dashboardBtn.title = 'ytNotes Dashboard (Not Logged In)';
            dashboardBtn.style.opacity = '0.6';
          }
          
          return true;
        }
      } catch (error) {
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Check if dashboard has logged out by checking its localStorage
async function checkDashboardLogout() {
  try {
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'checkDashboardLogout' }, (response) => {
        if (response && response.success) {
          resolve(response.loggedOut);
        } else {
          resolve(false);
        }
      });
    });
  } catch (error) {
    return false;
  }
}

// Periodic token sync (runs every 15 seconds)
function startPeriodicTokenSync() {
  
  setInterval(async () => {
    try {
      // Check for logout first
      const loggedOut = await detectLogout();
      if (loggedOut) {
        return;
      }
      
      // Try to sync tokens if we don't have them
      const { accessToken } = await getStoredTokens();
      if (!accessToken) {
        const synced = await detectLoginAndSync();
        if (synced) {
          // Markers will be shown by detectLoginAndSync, but add a backup call
          setTimeout(() => {
            addBookmarkMarkers();
          }, 2000);
        }
      }
    } catch (error) {
    }
  }, 15000); // 15 seconds (more frequent)
}

// More frequent logout detection (runs every 5 seconds)
function startFrequentLogoutDetection() {
  
  setInterval(async () => {
    try {
      // Only check for logout, don't sync tokens
      const loggedOut = await detectLogout();
      if (loggedOut) {
        // Force immediate marker removal
        const existingMarkers = document.querySelectorAll('.yt-bookmark-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // Update show markers button state
        const showMarkersBtn = document.getElementById('yt-show-markers-btn');
        if (showMarkersBtn) {
          showMarkersBtn.textContent = '📍';
          showMarkersBtn.title = 'Show Timeline Markers';
        }
        
        // Update dashboard button appearance
        const dashboardBtn = document.getElementById('yt-dashboard-btn');
        if (dashboardBtn) {
          dashboardBtn.title = 'ytNotes Dashboard (Not Logged In)';
          dashboardBtn.style.opacity = '0.6';
        }
      }
    } catch (error) {
    }
  }, 3000); // 3 seconds (more frequent than main auth check)
}

// Setup auto-login/logout detection
function setupAutoAuthDetection() {
  
  // Start periodic token sync
  startPeriodicTokenSync();
  
  // Start frequent logout detection
  startFrequentLogoutDetection();
  
  // Listen for storage changes (when user logs in/out on dashboard)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.accessToken || changes.refreshToken)) {
      
      // If tokens were removed, immediately remove markers
      if (changes.accessToken && changes.accessToken.newValue === undefined) {
        const existingMarkers = document.querySelectorAll('.yt-bookmark-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // Update show markers button state
        const showMarkersBtn = document.getElementById('yt-show-markers-btn');
        if (showMarkersBtn) {
          showMarkersBtn.textContent = '📍';
          showMarkersBtn.title = 'Show Timeline Markers';
        }
        
        // Update dashboard button appearance
        const dashboardBtn = document.getElementById('yt-dashboard-btn');
        if (dashboardBtn) {
          dashboardBtn.title = 'ytNotes Dashboard (Not Logged In)';
          dashboardBtn.style.opacity = '0.6';
        }
      }
    }
  });
  
  // Add immediate logout detection on page load
  setTimeout(async () => {
    const loggedOut = await detectLogout();
    if (loggedOut) {
    }
  }, 1000); // Check after 1 second
  
  // Note: Removed chrome.tabs API calls as they're not available in content scripts
  // Token syncing will be handled by periodic checks and manual sync requests
}

// Check authentication status
async function checkAuthStatus() {
  try {
    let { accessToken } = await getStoredTokens();
    
    if (!accessToken) {
      return false;
    }
    
    // Use fetchWithAuth which handles token refresh automatically
    const response = await fetchWithAuth('https://ytnotes-server.onrender.com/auth/status');
    const data = await response.json();
    
    return data.authenticated || false;
  } catch (error) {
    return false;
  }
}

// Show authentication required popup
function showAuthRequiredPopup() {
  // Remove existing popup
  const existingPopup = document.getElementById('yt-notes-auth-popup');
  if (existingPopup) {
    existingPopup.remove();
  }

  // YouTube dark/light theme detection
  const isDark = document.documentElement.getAttribute('dark') !== null || document.documentElement.classList.contains('dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const bg = isDark ? '#212121' : '#fff';
  const border = isDark ? '#303030' : '#ccc';
  const shadow = isDark ? '0 4px 24px rgba(0,0,0,0.7)' : '0 4px 12px rgba(0,0,0,0.15)';
  const text = isDark ? '#fff' : '#222';
  const subtext = isDark ? '#aaa' : '#555';
  const btnBlue = '#fc466b';

  const popupHTML = `
    <div id="yt-notes-auth-popup" style="position: absolute; z-index: 10000; background: ${bg}; border: 1px solid ${border}; border-radius: 12px; box-shadow: ${shadow}; padding: 20px; min-width: 320px; max-width: 400px; font-family: Roboto, Arial, sans-serif; color: ${text};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <h3 style="margin: 0; font-size: 18px; color: ${text}; font-weight: 500; letter-spacing: 0.01em;">🔐 Authentication Required</h3>
        <button id="yt-notes-auth-close" style="background: none; border: none; font-size: 22px; cursor: pointer; color: ${subtext}; line-height: 1;">×</button>
      </div>
      <div style="margin-bottom: 16px; color: ${subtext}; font-size: 14px; line-height: 1.4;">
        To save notes and screenshots, you need to log in to your Google account first.
      </div>
      <div style="display: flex; gap: 10px;">
        <a href="https://ytnotes.netlify.app" target="_blank" style="flex: 1; padding: 10px 0; background: ${btnBlue}; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500; letter-spacing: 0.01em; transition: background 0.2s; text-decoration: none; text-align: center; display: inline-block;">Go to Dashboard</a>
        <button id="yt-notes-auth-cancel" style="flex: 1; padding: 10px 0; background: ${isDark ? '#383838' : '#f2f2f2'}; color: ${isDark ? '#fff' : '#222'}; border: 1px solid ${isDark ? '#555' : '#ccc'}; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500; letter-spacing: 0.01em; transition: background 0.2s;">Cancel</button>
      </div>
    </div>
  `;
  
  const div = document.createElement('div');
  div.innerHTML = popupHTML;
  document.body.appendChild(div.firstElementChild);

  // Position popup near the extension button
  const popup = document.getElementById('yt-notes-auth-popup');
  const button = document.querySelector('[data-yt-notes-button]');
  if (button) {
    const rect = button.getBoundingClientRect();
    popup.style.left = `${rect.left}px`;
    popup.style.top = `${rect.bottom + 10}px`;
  } else {
    popup.style.left = '20px';
    popup.style.top = '80px';
  }

  // Add event listeners
  document.getElementById('yt-notes-auth-close').addEventListener('click', () => {
    popup.remove();
  });
  document.getElementById('yt-notes-auth-cancel').addEventListener('click', () => {
    popup.remove();
  });

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (popup.parentNode) {
      popup.remove();
    }
  }, 5000);
}

// Create and inject the custom popup HTML
function createPopupHTML() {
  // Always remove existing popup first
  const existingPopup = document.getElementById('yt-notes-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // YouTube dark/light theme detection
  const isDark = document.documentElement.getAttribute('dark') !== null || document.documentElement.classList.contains('dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const bg = isDark ? '#212121' : '#fff';
  const border = isDark ? '#303030' : '#ccc';
  const shadow = isDark ? '0 4px 24px rgba(0,0,0,0.7)' : '0 4px 12px rgba(0,0,0,0.15)';
  const text = isDark ? '#fff' : '#222';
  const subtext = isDark ? '#aaa' : '#555';
  const btnBlue = '#fc466b';
  const btnGray = isDark ? '#383838' : '#f2f2f2';
  const btnGrayText = isDark ? '#fff' : '#222';
  const btnGrayBorder = isDark ? '#555' : '#ccc';

  const popupHTML = `
    <div id="yt-notes-popup" style="display: none; position: absolute; z-index: 10000; background: ${bg}; border: 1px solid ${border}; border-radius: 12px; box-shadow: ${shadow}; padding: 20px 20px 16px 20px; min-width: 320px; max-width: 400px; font-family: Roboto, Arial, sans-serif; color: ${text};">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <h3 style="margin: 0; font-size: 18px; color: ${text}; font-weight: 500; letter-spacing: 0.01em;">YouTube Notes</h3>
        <button id="yt-notes-close" style="background: none; border: none; font-size: 22px; cursor: pointer; color: ${subtext}; line-height: 1;">×</button>
      </div>
      <div style="margin-bottom: 12px;">
        <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; color: ${subtext};">
          <input type="checkbox" id="yt-notes-screenshot" checked style="margin: 0; accent-color: ${btnBlue};">
          Capture screenshot
        </label>
      </div>
      <textarea id="yt-notes-textarea" placeholder="Add your note here..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid ${border}; border-radius: 6px; resize: vertical; font-family: inherit; font-size: 15px; background: ${isDark ? '#181818' : '#fafafa'}; color: ${text}; margin-bottom: 14px; transition: border 0.2s; box-sizing: border-box;"></textarea>
      <div style="display: flex; gap: 10px; margin-bottom: 2px;">
        <button id="yt-notes-save" onclick="window.ytNotesSaveNote && window.ytNotesSaveNote()" style="flex: 1; padding: 10px 0; background: ${btnBlue}; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500; letter-spacing: 0.01em; transition: background 0.2s; position: relative;">
          <span id="yt-notes-save-text">Save Note</span>
          <div id="yt-notes-save-spinner" style="display: none; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; border: 2px solid transparent; border-top: 2px solid #fff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        </button>
        <button id="yt-notes-cancel" onclick="window.ytNotesHidePopup && window.ytNotesHidePopup()" style="flex: 1; padding: 10px 0; background: ${btnGray}; color: ${btnGrayText}; border: 1px solid ${btnGrayBorder}; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500; letter-spacing: 0.01em; transition: background 0.2s;">Cancel</button>
      </div>
      <div id="yt-notes-status" style="margin-top: 10px; padding: 8px; border-radius: 4px; font-size: 13px; display: none;"></div>
      <style>
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      </style>
    </div>
  `;
  const div = document.createElement('div');
  div.innerHTML = popupHTML;
  document.body.appendChild(div.firstElementChild);
}

// Create timeline marker
function createTimelineMarker(timestamp, note, videoDuration) {
  const marker = document.createElement('div');
  marker.className = 'yt-bookmark-marker';
  marker.style.position = 'absolute';
  marker.style.width = '8px';
  marker.style.height = '8px';
  marker.style.backgroundColor = '#ff0000';
  marker.style.borderRadius = '50%';
  marker.style.border = '2px solid white';
  marker.style.cursor = 'pointer';
  marker.style.zIndex = '1000';
  marker.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
  marker.style.top = '-4px';
  
  // Calculate position based on timestamp
  const percentage = (timestamp / videoDuration) * 100;
  marker.style.left = `${percentage}%`;
  
  // Add tooltip
  marker.title = `Bookmark at ${formatTime(timestamp)}\n${note}`;
  
  // Add click handler to seek to timestamp
  marker.addEventListener('click', (e) => {
    e.stopPropagation();
    const video = document.querySelector('video');
    if (video) {
      video.currentTime = timestamp;
    }
  });
  
  return marker;
}

// Format time in MM:SS format
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Add bookmark markers to timeline
async function addBookmarkMarkers() {
  const video = document.querySelector('video');
  const timeline = document.querySelector('.ytp-progress-bar');
  
  if (!video || !timeline) return;
  
  // Check authentication status first
  const isAuthenticated = await checkAuthStatus();
  if (!isAuthenticated) {
    return;
  }
  
  // Remove existing markers
  const existingMarkers = document.querySelectorAll('.yt-bookmark-marker');
  existingMarkers.forEach(marker => marker.remove());
  
  // Add a small delay to ensure the page is fully loaded
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Get current video ID
    const url = new URL(window.location.href);
    const videoId = url.searchParams.get('v');
    
    if (!videoId) return;
    
    // Check if server is running first
    try {
      const healthCheck = await fetchWithAuth('https://ytnotes-server.onrender.com/');
      if (!healthCheck.ok) {
        return;
      }
    } catch (error) {
      return;
    }
    
    // Fetch bookmarks for this video with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetchWithAuth(`https://ytnotes-server.onrender.com/bookmark/${videoId}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const bookmarks = await response.json();
      
      // Ensure bookmarks is an array before processing
      if (Array.isArray(bookmarks)) {
        // Add markers for each bookmark
        bookmarks.forEach(bookmark => {
          if (bookmark && bookmark.timestamp !== undefined && bookmark.note) {
            const marker = createTimelineMarker(bookmark.timestamp, bookmark.note, video.duration);
            timeline.appendChild(marker);
          }
        });
      } else {
      }
    } else {
    }
  } catch (error) {
    // Only log network errors, not aborted requests
  }
}

// Show popup at the specified position
function showPopup(x, y) {
  let popup = document.getElementById('yt-notes-popup');
  
  // If popup doesn't exist, create it
  if (!popup) {
    createPopupHTML();
    popup = document.getElementById('yt-notes-popup');
    if (!popup) {
      return;
    }
  }
  
  // Rebind event listeners every time popup is shown
  bindPopupEventListeners();
  
  // First make the popup visible but off-screen to get its dimensions
  popup.style.display = 'block';
  popup.style.position = 'absolute';
  popup.style.left = '-9999px';
  popup.style.top = '-9999px';
  
  // Force a reflow to get accurate dimensions
  popup.offsetHeight;
  
  // Position the popup above the timeline
  const videoPlayer = document.querySelector('.html5-video-player');
  if (videoPlayer) {
    const playerRect = videoPlayer.getBoundingClientRect();
    const timeline = document.querySelector('.ytp-progress-bar');
    if (timeline) {
      const timelineRect = timeline.getBoundingClientRect();
      // Position above the timeline with some margin
      popup.style.left = (timelineRect.left + window.scrollX) + 'px';
      popup.style.top = (timelineRect.top + window.scrollY - popup.offsetHeight - 20) + 'px';
    } else {
      // Fallback positioning - center above the video player
      popup.style.left = (playerRect.left + window.scrollX + (playerRect.width - popup.offsetWidth) / 2) + 'px';
      popup.style.top = (playerRect.top + window.scrollY + playerRect.height / 2 - popup.offsetHeight - 20) + 'px';
    }
  }
  
  const textarea = document.getElementById('yt-notes-textarea');
  if (textarea) {
    textarea.focus();
  }
  
  // Ensure save button is enabled when popup is shown
  const saveBtn = document.getElementById('yt-notes-save');
  if (saveBtn) {
    saveBtn.disabled = false;
  }
}

// Hide popup
function hidePopup() {
  const popup = document.getElementById('yt-notes-popup');
  if (popup) {
    popup.style.display = 'none';
    document.getElementById('yt-notes-textarea').value = '';
    document.getElementById('yt-notes-status').style.display = 'none';
  }
}

// Add silent screenshot
async function addSilentScreenshot() {
  const video = document.querySelector('video');
  const title = document.title.replace(' - YouTube', '');
  const url = new URL(window.location.href);
  const videoId = url.searchParams.get('v');
  
  if (!video || !videoId) {
    return;
  }

  try {
    // Capture screenshot with better error handling
    let screenshot = null;
    if (video && video.videoWidth > 0 && video.videoHeight > 0) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        screenshot = canvas.toDataURL('image/png');
      } catch (error) {
        // Screenshot failed, continue without it
      }
    }

    const requestBody = {
      videoId,
      videoTitle: title,
      timestamp: Math.floor(video.currentTime),
      note: "I'm just a screenshot",
      screenshot: screenshot
    };

    // Retry logic for network requests
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout to 15 seconds
        
        const res = await fetchWithAuth('https://ytnotes-server.onrender.com/bookmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          // Refresh timeline markers after saving (non-blocking)
          setTimeout(() => {
            addBookmarkMarkers();
          }, 500);
          
          return; // Success, exit the function
        } else {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
      } catch (error) {
        lastError = error;
        retries--;
        
        if (error.name === 'AbortError') {
          // Timeout occurred, try again
        } else if (retries > 0) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // All retries failed
  } catch (error) {
    // Silent failure for automatic screenshots
  }
}

// Add silent highlight marker
async function addSilentHighlight() {
  const video = document.querySelector('video');
  const title = document.title.replace(' - YouTube', '');
  const url = new URL(window.location.href);
  const videoId = url.searchParams.get('v');
  
  if (!video || !videoId) {
    return;
  }

  try {
    const requestBody = {
      videoId,
      videoTitle: title,
      timestamp: Math.floor(video.currentTime),
      note: "I'm just a highlighter"
    };

    // Retry logic for network requests
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const res = await fetchWithAuth('https://ytnotes-server.onrender.com/bookmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          // Refresh timeline markers after saving
          setTimeout(() => {
            addBookmarkMarkers();
          }, 500);
          
          return; // Success, exit the function
        } else {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
      } catch (error) {
        lastError = error;
        retries--;
        
        if (error.name === 'AbortError') {
        } else if (retries > 0) {
        }
      }
    }
    
    // All retries failed
  } catch (error) {
  }
}

// Save note functionality
async function saveNote() {
  const note = document.getElementById('yt-notes-textarea').value.trim();
  const captureScreenshot = document.getElementById('yt-notes-screenshot').checked;
  const statusEl = document.getElementById('yt-notes-status');
  const saveBtn = document.getElementById('yt-notes-save');
  const saveText = document.getElementById('yt-notes-save-text');
  const saveSpinner = document.getElementById('yt-notes-save-spinner');
  
  if (!note) {
    if (saveBtn) saveBtn.disabled = false;
    return;
  }
  
  if (saveBtn) saveBtn.disabled = true;
  if (saveText) saveText.style.display = 'none';
  if (saveSpinner) saveSpinner.style.display = 'block';
  
  statusEl.textContent = 'Starting save process...';
  statusEl.style.display = 'block';
  statusEl.style.background = '#d1ecf1';
  statusEl.style.color = '#0c5460';
  statusEl.style.border = '1px solid #bee5eb';

  try {
    const video = document.querySelector('video');
    const title = document.title.replace(' - YouTube', '');
    const url = new URL(window.location.href);
    const videoId = url.searchParams.get('v');
    
    if (!video || !videoId) {
      throw new Error('Could not get video info.');
    }

    // Capture screenshot first if needed
    let screenshot = null;
    if (captureScreenshot && video) {
      statusEl.textContent = 'Capturing screenshot...';
      
      // Use setTimeout to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        screenshot = canvas.toDataURL('image/png');
      } catch (error) {
        // Screenshot failed, continue without it
      }
    }

    const requestBody = {
      videoId,
      videoTitle: title,
      timestamp: Math.floor(video.currentTime),
      note
    };

    if (screenshot) {
      requestBody.screenshot = screenshot;
    }

    // Clear the textarea immediately
    document.getElementById('yt-notes-textarea').value = '';
    
    // Reset button state before hiding popup
    if (saveBtn) saveBtn.disabled = false;
    if (saveText) saveText.style.display = 'inline';
    if (saveSpinner) saveSpinner.style.display = 'none';
    
    // Hide popup immediately - don't wait for the save to complete
    hidePopup();
    
    // Continue saving in the background (non-blocking)
    (async () => {
      let retries = 3;
      let lastError;
      
      while (retries > 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          
          const res = await fetchWithAuth('https://ytnotes-server.onrender.com/bookmark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          
          clearTimeout(timeoutId);
          
          if (res.ok) {
            // Success - refresh timeline markers after saving
            setTimeout(() => {
              addBookmarkMarkers();
            }, 500);
            return;
          } else {
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
        } catch (error) {
          lastError = error;
          retries--;
          
          // Wait a bit before retrying
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // All retries failed - could show a notification here if needed
      console.log('Failed to save note after all retries:', lastError?.message);
    })();
    
  } catch (error) {
    // Re-enable button and hide spinner in case of immediate errors
    if (saveBtn) saveBtn.disabled = false;
    if (saveText) saveText.style.display = 'inline';
    if (saveSpinner) saveSpinner.style.display = 'none';
    
    console.log('Error preparing note save:', error.message);
  }
}

// Global flag to prevent multiple initializations
let popupInitialized = false;

// Initialize popup functionality
function initializePopup() {
  // Prevent re-initialization
  if (popupInitialized) {
    return;
  }
  
  popupInitialized = true;
  
  // Create popup HTML
  createPopupHTML();
  
  // Bind event listeners
  bindPopupEventListeners();
  
  // Add click outside handler (only once)
  addClickOutsideHandler();
  
  // Make functions globally available for inline onclick
  window.ytNotesSaveNote = saveNote;
  window.ytNotesHidePopup = hidePopup;
  
  // Keyboard shortcuts
  document.addEventListener('keydown', async (e) => {
    // Only trigger shortcut if not focused in input/textarea/contenteditable
    const active = document.activeElement;
    const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
    
    // Check authentication for note-taking actions
    if (!isInput && (e.key === 'b' || e.key === 'h' || e.key === 's') && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const isAuthenticated = await checkAuthStatus();
      if (!isAuthenticated) {
        e.preventDefault();
        showAuthRequiredPopup();
        return;
      }
    }
    
    if (!isInput && e.key === 'b' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      const videoPlayer = document.querySelector('.html5-video-player');
      if (videoPlayer) {
        const rect = videoPlayer.getBoundingClientRect();
        showPopup(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    }
    // 'h' key for silent highlight marker
    if (!isInput && e.key === 'h' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      addSilentHighlight();
    }
    // 's' key for silent screenshot
    if (!isInput && e.key === 's' && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      addSilentScreenshot();
    }
    // Escape key to close popup
    if (e.key === 'Escape') {
      hidePopup();
    }
  });
}

// Bind popup event listeners
function bindPopupEventListeners() {
  // Use a simple, direct approach
  const saveBtn = document.getElementById('yt-notes-save');
  const closeBtn = document.getElementById('yt-notes-close');
  const cancelBtn = document.getElementById('yt-notes-cancel');
  
  // Direct onclick assignment - this is the most reliable method
  if (saveBtn) {
    // Remove any existing listeners first
    saveBtn.onclick = null;
    saveBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Show spinner immediately
      const saveText = document.getElementById('yt-notes-save-text');
      const saveSpinner = document.getElementById('yt-notes-save-spinner');
      if (saveText && saveSpinner) {
        saveText.style.display = 'none';
        saveSpinner.style.display = 'block';
      }
      
      // Show immediate feedback
      const statusEl = document.getElementById('yt-notes-status');
      if (statusEl) {
        statusEl.textContent = 'Starting save process...';
        statusEl.style.display = 'block';
        statusEl.style.background = '#d1ecf1';
        statusEl.style.color = '#0c5460';
        statusEl.style.border = '1px solid #bee5eb';
      }
      
      // Start save process
      saveNote();
    };
  }
  
  if (closeBtn) {
    // Remove any existing listeners first
    closeBtn.onclick = null;
    closeBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Allow closing even if save is in progress
      hidePopup();
    };
  }
  
  if (cancelBtn) {
    // Remove any existing listeners first
    cancelBtn.onclick = null;
    cancelBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Allow canceling even if save is in progress
      hidePopup();
    };
  }
}

// Global click outside handler (only add once)
let clickOutsideHandlerAdded = false;
function addClickOutsideHandler() {
  if (clickOutsideHandlerAdded) return;
  
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('yt-notes-popup');
    if (popup && !popup.contains(e.target) && !e.target.id.includes('yt-notes')) {
      hidePopup();
    }
  });
  
  clickOutsideHandlerAdded = true;
}

// Inject bookmark button
function injectBookmarkButton() {
  if (document.getElementById('yt-bookmark-btn')) return;
  const videoPlayer = document.querySelector('.html5-video-player');
  if (!videoPlayer) return;

  // Create container for both buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  // Bookmark button
  const btn = document.createElement('button');
  btn.id = 'yt-bookmark-btn';
  btn.textContent = '⭐';
  btn.style.cssText = `
    font-size: 24px;
    background: rgba(255,255,255,0.8);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    padding: 6px 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: background-color 0.2s;
  `;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check authentication
    const isAuthenticated = await checkAuthStatus();
    if (!isAuthenticated) {
      showAuthRequiredPopup();
      return;
    }
    
    const videoPlayer = document.querySelector('.html5-video-player');
    if (videoPlayer) {
      const rect = videoPlayer.getBoundingClientRect();
      showPopup(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  });

  // Show markers button
  const showMarkersBtn = document.createElement('button');
  showMarkersBtn.id = 'yt-show-markers-btn';
  showMarkersBtn.textContent = '📍';
  showMarkersBtn.title = 'Show/Hide Timeline Markers';
  showMarkersBtn.style.cssText = `
    font-size: 20px;
    background: rgba(255,255,255,0.8);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    padding: 6px 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: background-color 0.2s;
  `;

  showMarkersBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check authentication
    const isAuthenticated = await checkAuthStatus();
    if (!isAuthenticated) {
      showAuthRequiredPopup();
      return;
    }
    
    // Toggle markers visibility
    const existingMarkers = document.querySelectorAll('.yt-bookmark-marker');
    if (existingMarkers.length > 0) {
      // Hide markers
      existingMarkers.forEach(marker => marker.remove());
      showMarkersBtn.textContent = '📍';
      showMarkersBtn.title = 'Show Timeline Markers';
    } else {
      // Show markers
      addBookmarkMarkers();
      showMarkersBtn.textContent = '🔒';
      showMarkersBtn.title = 'Hide Timeline Markers';
    }
  });

  // Add hover effects
  [btn, showMarkersBtn].forEach(button => {
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(255,255,255,0.9)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(255,255,255,0.8)';
    });
  });

  buttonContainer.appendChild(btn);
  buttonContainer.appendChild(showMarkersBtn);
  videoPlayer.appendChild(buttonContainer);
}

// Inject dashboard button next to subscribe button
function injectDashboardButton() {
  if (document.getElementById('yt-dashboard-btn')) return;
  
  // Try multiple selectors to find the right container
  let actionsContainer = document.querySelector('#actions #buttons');
  if (!actionsContainer) {
    actionsContainer = document.querySelector('#actions');
  }
  if (!actionsContainer) {
    actionsContainer = document.querySelector('#buttons');
  }
  if (!actionsContainer) {
    // Fallback to subscribe button area
    const subscribeButton = document.querySelector('#subscribe-button ytd-subscribe-button-renderer');
    if (subscribeButton) {
      actionsContainer = subscribeButton.parentNode;
    }
  }
  
  if (!actionsContainer) {
    return;
  }
  
  const dashboardBtn = document.createElement('button');
  dashboardBtn.id = 'yt-dashboard-btn';
  dashboardBtn.title = 'ytNotes dashboard';
  dashboardBtn.style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    transition: background-color 0.2s;
    margin-left: 8px;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    flex-shrink: 0;
  `;
  
  const img = document.createElement('img');
  img.src = chrome.runtime.getURL('icon48.png');
  img.style.cssText = `
    width: 32px;
    height: 32px;
    display: block;
  `;
  
  // Add error handling for image loading
  img.onerror = () => {
    img.src = chrome.runtime.getURL('icon128.png');
    img.onerror = () => {
      img.src = chrome.runtime.getURL('icon32.png');
      img.onerror = () => {
      };
    };
  };
  
  dashboardBtn.appendChild(img);
  
  dashboardBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check authentication status and update tooltip
    const isAuthenticated = await checkAuthStatus();
    if (isAuthenticated) {
      dashboardBtn.title = 'ytNotes Dashboard (Logged In)';
      dashboardBtn.style.opacity = '1';
    } else {
      dashboardBtn.title = 'ytNotes Dashboard (Not Logged In)';
      dashboardBtn.style.opacity = '0.6';
    }
    
    // Open dashboard in new tab
    window.open('https://ytnotes.netlify.app', '_blank');
  });
  
  dashboardBtn.addEventListener('mouseenter', () => {
    dashboardBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  });
  
  dashboardBtn.addEventListener('mouseleave', () => {
    dashboardBtn.style.backgroundColor = 'transparent';
  });
  
  // Insert at the end of the actions container
  actionsContainer.appendChild(dashboardBtn);
}

// Check if server is ready before initializing
async function waitForServer() {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetchWithAuth('https://ytnotes-server.onrender.com/');
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Ignore timeout errors
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
}

// Listen for messages from dashboard or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  
  if (request.action === 'getTokens') {
    // Dashboard is requesting tokens from extension
    getStoredTokens().then(tokens => {
      sendResponse(tokens);
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'syncTokens') {
    // Manual token sync request
    detectLoginAndSync().then(synced => {
      sendResponse({ synced });
    });
    return true;
  }
  
  if (request.action === 'checkAuth') {
    // Check authentication status
    checkAuthStatus().then(authenticated => {
      sendResponse({ authenticated });
    });
    return true;
  }
  
  if (request.action === 'logout') {
    // Manual logout request
    clearStoredTokens().then(() => {
      sendResponse({ loggedOut: true });
    });
    return true;
  }
  
  if (request.action === 'storeTokens') {
    // Dashboard is sending tokens to store
    const { accessToken, refreshToken } = request;
    if (accessToken && refreshToken) {
      storeTokens(accessToken, refreshToken).then(() => {
        sendResponse({ stored: true });
      });
    } else {
      // Clear tokens if null values are sent
      clearStoredTokens().then(() => {
        sendResponse({ cleared: true });
      });
    }
    return true;
  }
});

// Initialize everything
setTimeout(async () => {
  
  // Setup auto-login/logout detection
  setupAutoAuthDetection();
  
  // Always inject UI elements first
  initializePopup();
  injectBookmarkButton();
  injectDashboardButton();
  
  // Wait for server to be ready before fetching bookmarks
  const serverReady = await waitForServer();
  
  if (serverReady) {
    // Check authentication status and update UI accordingly
    const isAuthenticated = await checkAuthStatus();
    
    if (isAuthenticated) {
      // Add bookmark markers after server is confirmed ready
      setTimeout(() => {
        addBookmarkMarkers();
      }, 1000);
      
      // Also try again after 3 seconds as backup
      setTimeout(() => {
        addBookmarkMarkers();
      }, 3000);
      
      // Update show markers button state
      const showMarkersBtn = document.getElementById('yt-show-markers-btn');
      if (showMarkersBtn) {
        showMarkersBtn.textContent = '🔒';
        showMarkersBtn.title = 'Hide Timeline Markers';
      }
    } else {
      
      // Update show markers button state
      const showMarkersBtn = document.getElementById('yt-show-markers-btn');
      if (showMarkersBtn) {
        showMarkersBtn.textContent = '📍';
        showMarkersBtn.title = 'Show Timeline Markers';
      }
    }
    
    // Set up periodic authentication checks
    let previousAuthStatus = isAuthenticated;
    setInterval(async () => {
      const currentAuthStatus = await checkAuthStatus();
      
      if (!currentAuthStatus && previousAuthStatus) {
        // User logged out - remove timeline markers
        const existingMarkers = document.querySelectorAll('.yt-bookmark-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        // Update show markers button state
        const showMarkersBtn = document.getElementById('yt-show-markers-btn');
        if (showMarkersBtn) {
          showMarkersBtn.textContent = '📍';
          showMarkersBtn.title = 'Show Timeline Markers';
        }
        
        // Update dashboard button appearance
        const dashboardBtn = document.getElementById('yt-dashboard-btn');
        if (dashboardBtn) {
          dashboardBtn.title = 'ytNotes Dashboard (Not Logged In)';
          dashboardBtn.style.opacity = '0.6';
        }
      } else if (currentAuthStatus && !previousAuthStatus) {
        // User logged in - add timeline markers
        addBookmarkMarkers();
        
        // Update show markers button state
        const showMarkersBtn = document.getElementById('yt-show-markers-btn');
        if (showMarkersBtn) {
          showMarkersBtn.textContent = '🔒';
          showMarkersBtn.title = 'Hide Timeline Markers';
        }
        
        // Update dashboard button appearance
        const dashboardBtn = document.getElementById('yt-dashboard-btn');
        if (dashboardBtn) {
          dashboardBtn.title = 'ytNotes Dashboard (Logged In)';
          dashboardBtn.style.opacity = '1';
        }
      }
      
      // Debug: Log auth status changes
      if (currentAuthStatus !== previousAuthStatus) {
        // Auth status changed
      }
      
      previousAuthStatus = currentAuthStatus;
    }, 5000); // Check every 5 seconds
  } else {
  }
}, 2000);

// Re-inject if navigating between videos (YouTube SPA)
let lastUrl = location.href;
setInterval(async () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    
    // Remove existing elements
    const existingPopup = document.getElementById('yt-notes-popup');
    if (existingPopup) {
      existingPopup.remove();
    }
    
    const existingBookmarkBtn = document.getElementById('yt-bookmark-btn');
    if (existingBookmarkBtn) {
      existingBookmarkBtn.remove();
    }
    
    const existingShowMarkersBtn = document.getElementById('yt-show-markers-btn');
    if (existingShowMarkersBtn) {
      existingShowMarkersBtn.remove();
    }
    
    const existingDashboardBtn = document.getElementById('yt-dashboard-btn');
    if (existingDashboardBtn) {
      existingDashboardBtn.remove();
    }
    
    // Re-initialize after a short delay
    setTimeout(async () => {
      initializePopup();
      injectBookmarkButton();
      injectDashboardButton();
      
      const serverReady = await waitForServer();
      if (serverReady) {
        // Check for logout first
        const loggedOut = await detectLogout();
        if (loggedOut) {
          return;
        }
        
        // Check if user is authenticated before showing markers
        const isAuthenticated = await checkAuthStatus();
        if (isAuthenticated) {
          setTimeout(() => {
            addBookmarkMarkers();
          }, 1000);
          
          // Also try again after 3 seconds as backup
          setTimeout(() => {
            addBookmarkMarkers();
          }, 3000);
        } else {
        }
      }
    }, 1000);
  }
}, 1000); 