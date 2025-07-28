// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveNote') {
    handleSaveNote(request, sender, sendResponse);
    return true; // Required for async sendResponse
  }
});

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

function saveNoteInPage(note, captureScreenshot) {
  return new Promise((resolve) => {
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

    fetch('http://localhost:5000/bookmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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