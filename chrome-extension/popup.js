// Wrap everything in a function that runs when the popup loads
document.addEventListener('DOMContentLoaded', function() {
  const saveBtn = document.getElementById('saveBtn');
  const noteInput = document.getElementById('note');
  const captureScreenshot = document.getElementById('captureScreenshot');
  const statusEl = document.getElementById('status');

  // Clear any previous state
  noteInput.value = '';
  statusEl.textContent = '';
  statusEl.className = 'status';
  saveBtn.disabled = false;

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

        // Send to backend
        try {
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            credentials: 'include'
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
});