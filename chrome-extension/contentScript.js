// Create and inject the custom popup HTML
function createPopupHTML() {
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
        <button id="yt-notes-save" style="flex: 1; padding: 10px 0; background: ${btnBlue}; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500; letter-spacing: 0.01em; transition: background 0.2s;">Save Note</button>
        <button id="yt-notes-cancel" style="flex: 1; padding: 10px 0; background: ${btnGray}; color: ${btnGrayText}; border: 1px solid ${btnGrayBorder}; border-radius: 6px; cursor: pointer; font-size: 15px; font-weight: 500; letter-spacing: 0.01em; transition: background 0.2s;">Cancel</button>
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
  const popup = document.getElementById('yt-notes-popup');
  if (!popup) return;
  
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
  
  document.getElementById('yt-notes-textarea').focus();
  
  // Pause the video
  const video = document.querySelector('video');
  if (video && !video.paused) {
    video.pause();
  }
}

// Hide popup
function hidePopup() {
  const popup = document.getElementById('yt-notes-popup');
  if (popup) {
    popup.style.display = 'none';
    document.getElementById('yt-notes-textarea').value = '';
    document.getElementById('yt-notes-status').style.display = 'none';
    
    // Resume the video
    const video = document.querySelector('video');
    if (video && video.paused) {
      video.play();
    }
  }
}

// Save note functionality
async function saveNote() {
  const note = document.getElementById('yt-notes-textarea').value.trim();
  const captureScreenshot = document.getElementById('yt-notes-screenshot').checked;
  const statusEl = document.getElementById('yt-notes-status');
  const saveBtn = document.getElementById('yt-notes-save');
  
  if (!note) return;
  
  saveBtn.disabled = true;
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
  
  saveBtn.disabled = false;
}

// Initialize popup functionality
function initializePopup() {
  // Create popup HTML
  createPopupHTML();
  
  // Add event listeners
  document.getElementById('yt-notes-close').onclick = hidePopup;
  document.getElementById('yt-notes-cancel').onclick = hidePopup;
  document.getElementById('yt-notes-save').onclick = saveNote;
  
  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('yt-notes-popup');
    if (popup && !popup.contains(e.target) && !e.target.id.includes('yt-notes')) {
      hidePopup();
    }
  });
  
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
    // Escape key to close popup
    if (e.key === 'Escape') {
      hidePopup();
    }
  });
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
        console.log('Server is ready');
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
    setTimeout(async () => {
      injectBookmarkButton();
      // Wait for server and add markers for new video
      const serverReady = await waitForServer();
      if (serverReady) {
        setTimeout(() => {
          addBookmarkMarkers();
        }, 1000);
      }
    }, 2000);
  }
}, 1000); 