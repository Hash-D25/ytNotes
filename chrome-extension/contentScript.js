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
        <button id="yt-notes-save" onclick="window.ytNotesSaveNote && window.ytNotesSaveNote()" style="flex: 1; padding: 10px 0; background: ${btnBlue}; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500; letter-spacing: 0.01em; transition: background 0.2s;">Save Note</button>
        <button id="yt-notes-cancel" onclick="window.ytNotesHidePopup && window.ytNotesHidePopup()" style="flex: 1; padding: 10px 0; background: ${btnGray}; color: ${btnGrayText}; border: 1px solid ${btnGrayBorder}; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500; letter-spacing: 0.01em; transition: background 0.2s;">Cancel</button>
      </div>
      <div id="yt-notes-status" style="margin-top: 10px; padding: 8px; border-radius: 4px; font-size: 13px; display: none;"></div>
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
      const healthCheck = await fetch('http://localhost:5000/', { 
        signal: AbortSignal.timeout(3000) 
      });
      if (!healthCheck.ok) {
        console.warn('Server health check failed');
        return;
      }
    } catch (error) {
      console.warn('Server appears to be offline');
      return;
    }
    
    // Fetch bookmarks for this video with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`http://localhost:5000/bookmark/${videoId}`, {
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
        console.warn('Invalid bookmarks data received');
      }
    } else {
      console.warn(`Failed to fetch bookmarks: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    // Only log network errors, not aborted requests
    if (error.name !== 'AbortError') {
      console.warn('Failed to fetch bookmarks:', error.message);
    }
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
      console.error('Failed to create popup');
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
    console.warn('Could not get video info for silent screenshot');
    return;
  }

  try {
    // Capture screenshot
    let screenshot = null;
    if (video) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        screenshot = canvas.toDataURL('image/png');
      } catch (error) {
        console.error('Failed to capture screenshot:', error);
        return;
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
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const res = await fetch('http://localhost:5000/bookmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
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
          console.warn('Request timeout, retrying...');
        } else if (retries > 0) {
          console.warn(`Request failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }
    
    // All retries failed
    console.warn('Failed to capture silent screenshot:', lastError.message);
  } catch (error) {
    console.warn('Error capturing silent screenshot:', error.message);
  }
}

// Add silent highlight marker
async function addSilentHighlight() {
  const video = document.querySelector('video');
  const title = document.title.replace(' - YouTube', '');
  const url = new URL(window.location.href);
  const videoId = url.searchParams.get('v');
  
  if (!video || !videoId) {
    console.warn('Could not get video info for silent highlight');
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
        
        const res = await fetch('http://localhost:5000/bookmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
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
          console.warn('Request timeout, retrying...');
        } else if (retries > 0) {
          console.warn(`Request failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }
    
    // All retries failed
    console.warn('Failed to add silent highlight marker:', lastError.message);
  } catch (error) {
    console.warn('Error adding silent highlight marker:', error.message);
  }
}

// Save note functionality
async function saveNote() {
  const note = document.getElementById('yt-notes-textarea').value.trim();
  const captureScreenshot = document.getElementById('yt-notes-screenshot').checked;
  const statusEl = document.getElementById('yt-notes-status');
  const saveBtn = document.getElementById('yt-notes-save');
  
  if (!note) {
    if (saveBtn) saveBtn.disabled = false; // Re-enable button
    return;
  }
  
  if (saveBtn) saveBtn.disabled = true;
  statusEl.textContent = 'Saving...';
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

    let screenshot = null;
    if (captureScreenshot && video) {
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

    const requestBody = {
      videoId,
      videoTitle: title,
      timestamp: Math.floor(video.currentTime),
      note
    };

    if (screenshot) {
      requestBody.screenshot = screenshot;
    }

    // Retry logic for network requests
    let retries = 3;
    let lastError;
    
    while (retries > 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const res = await fetch('http://localhost:5000/bookmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          statusEl.textContent = `Note saved!${screenshot ? ' Screenshot captured.' : ''}`;
          statusEl.style.background = '#d4edda';
          statusEl.style.color = '#155724';
          statusEl.style.border = '1px solid #c3e6cb';
          document.getElementById('yt-notes-textarea').value = '';
          
          // Re-enable save button immediately after success
          if (saveBtn) {
            saveBtn.disabled = false;
          }
          
          // Refresh timeline markers after saving
          setTimeout(() => {
            addBookmarkMarkers();
          }, 500);
          
          // Hide popup after 2 seconds
          setTimeout(hidePopup, 2000);
          return; // Success, exit the function
        } else {
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
      } catch (error) {
        lastError = error;
        retries--;
        
        if (error.name === 'AbortError') {
          console.warn('Request timeout, retrying...');
        } else if (retries > 0) {
          console.warn(`Request failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }
    
    // All retries failed
    statusEl.textContent = lastError.message || 'Network error. Please check if the server is running.';
    statusEl.style.background = '#f8d7da';
    statusEl.style.color = '#721c24';
    statusEl.style.border = '1px solid #f5c6cb';
  } catch (error) {
    statusEl.textContent = error.message || 'An unexpected error occurred.';
    statusEl.style.background = '#f8d7da';
    statusEl.style.color = '#721c24';
    statusEl.style.border = '1px solid #f5c6cb';
  }
  
  if (saveBtn) saveBtn.disabled = false; // Always re-enable button
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
  document.addEventListener('keydown', (e) => {
    // Only trigger shortcut if not focused in input/textarea/contenteditable
    const active = document.activeElement;
    const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
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
      saveNote();
    };
  }
  
  if (closeBtn) {
    // Remove any existing listeners first
    closeBtn.onclick = null;
    closeBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      hidePopup();
    };
  }
  
  if (cancelBtn) {
    // Remove any existing listeners first
    cancelBtn.onclick = null;
    cancelBtn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
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

  const btn = document.createElement('button');
  btn.id = 'yt-bookmark-btn';
  btn.textContent = '🔖';
  btn.style.position = 'absolute';
  btn.style.top = '16px';
  btn.style.right = '16px';
  btn.style.zIndex = '1000';
  btn.style.fontSize = '24px';
  btn.style.background = 'rgba(255,255,255,0.8)';
  btn.style.border = 'none';
  btn.style.borderRadius = '50%';
  btn.style.cursor = 'pointer';
  btn.style.padding = '6px 10px';
  btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const videoPlayer = document.querySelector('.html5-video-player');
    if (videoPlayer) {
      const rect = videoPlayer.getBoundingClientRect();
      showPopup(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  });

  videoPlayer.appendChild(btn);
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
    console.warn('Could not find actions container for dashboard button');
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
    console.warn('Failed to load icon48.png, trying fallback...');
    img.src = chrome.runtime.getURL('icon128.png');
    img.onerror = () => {
      console.warn('Failed to load icon128.png, trying icon32.png...');
      img.src = chrome.runtime.getURL('icon32.png');
      img.onerror = () => {
        console.error('All icon files failed to load');
        // Fallback to text
        dashboardBtn.innerHTML = '📊';
        dashboardBtn.style.fontSize = '20px';
      };
    };
  };
  
  dashboardBtn.appendChild(img);
  
  dashboardBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Open dashboard in new tab
    window.open('http://localhost:5173', '_blank');
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
      const response = await fetch('http://localhost:5000/', {
        signal: AbortSignal.timeout(2000)
      });
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Ignore timeout errors
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.warn('Server not available after 10 attempts');
  return false;
}

// Initialize everything
setTimeout(async () => {
  initializePopup();
  injectBookmarkButton();
  injectDashboardButton();
  
  // Wait for server to be ready before fetching bookmarks
  const serverReady = await waitForServer();
  
  if (serverReady) {
    // Add bookmark markers after server is confirmed ready
    setTimeout(() => {
      addBookmarkMarkers();
    }, 1000);
    
    // Also try again after 3 seconds as backup
    setTimeout(() => {
      addBookmarkMarkers();
    }, 3000);
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
        setTimeout(() => {
          addBookmarkMarkers();
        }, 1000);
      }
    }, 1000);
  }
}, 1000); 