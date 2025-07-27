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

  btn.onclick = () => {
    chrome.runtime.sendMessage({ action: 'open_popup' });
  };

  videoPlayer.appendChild(btn);
}

setTimeout(injectBookmarkButton, 2000);
// Re-inject if navigating between videos (YouTube SPA)
let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(injectBookmarkButton, 2000);
  }
}, 1000); 