import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowTopRightOnSquareIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import NotesList from './NotesList';

export default function NotesPage({ videos, fetchVideos, search, setSearch, sortBy, setSortBy, sortOrder, setSortOrder }) {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // All hooks must be called at the top level, before any conditional returns
  const [localNotes, setLocalNotes] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const iframeRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [apiReady, setApiReady] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Get timestamp from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const timestampParam = urlParams.get('t');

  // Find video - moved after hooks
  const video = videos.find(v => v.videoId === videoId);

  // Initialize localNotes when video changes
  useEffect(() => {
    if (video) {
      setLocalNotes(video.notes || []);
    }
  }, [video]);

  // Check if focus is in an input field
  const isInputFocused = () => {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
  };

  // Keyboard shortcuts handler - use useCallback to prevent recreation
  const handleKeyDown = useCallback((event) => {
    // Don't handle shortcuts if focus is in input field (except for specific shortcuts)
    if (isInputFocused() && !['m', 'c', '?', 'Escape'].includes(event.key)) {
      return;
    }

    if (!apiReady || !player) return;

    // Prevent default behavior for these keys
    const preventDefaultKeys = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'f', 'm', 'c', '<', '>'];
    if (preventDefaultKeys.includes(event.key)) {
      event.preventDefault();
    }

    switch (event.key) {
      case ' ': // Space - Play/Pause
        if (isInputFocused()) return; // Don't handle space in input fields
        if (player.getPlayerState() === 1) { // Playing
          player.pauseVideo();
        } else {
          player.playVideo();
        }
        break;
      
      case 'ArrowLeft': // Left arrow - Rewind 10 seconds
        if (isInputFocused()) return;
        const currentTime = player.getCurrentTime();
        player.seekTo(Math.max(0, currentTime - 10), true);
        break;
      
      case 'ArrowRight': // Right arrow - Forward 10 seconds
        if (isInputFocused()) return;
        const currentTimeForward = player.getCurrentTime();
        player.seekTo(currentTimeForward + 10, true);
        break;
      
      case 'ArrowUp': // Up arrow - Volume up
        const currentVolume = player.getVolume();
        player.setVolume(Math.min(100, currentVolume + 10));
        break;
      
      case 'ArrowDown': // Down arrow - Volume down
        const currentVolumeDown = player.getVolume();
        player.setVolume(Math.max(0, currentVolumeDown - 10));
        break;
      
      case 'f': // F key - Toggle fullscreen
        if (player.getPlayerState() !== -1) { // Not unstarted
          const iframe = iframeRef.current;
          if (iframe) {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              iframe.requestFullscreen();
            }
          }
        }
        break;
      
      case 'm': // M key - Toggle mute
        if (player.isMuted()) {
          player.unMute();
        } else {
          player.mute();
        }
        break;

      case 'c': // C key - Toggle captions
        try {
          const currentCaptions = player.getOption('captions', 'track');
          if (currentCaptions && currentCaptions.length > 0) {
            player.unloadModule('captions');
          } else {
            player.loadModule('captions');
            player.setOption('captions', 'track', {});
          }
        } catch (error) {
          console.log('Captions not available for this video');
        }
        break;

      case '<': // Shift + < - Decrease playback speed
        if (event.shiftKey) {
          const currentRate = player.getPlaybackRate();
          const newRate = Math.max(0.25, currentRate - 0.25);
          player.setPlaybackRate(newRate);
          setPlaybackRate(newRate);
        }
        break;

      case '>': // Shift + > - Increase playback speed
        if (event.shiftKey) {
          const currentRate = player.getPlaybackRate();
          const newRate = Math.min(2, currentRate + 0.25);
          player.setPlaybackRate(newRate);
          setPlaybackRate(newRate);
        }
        break;
      
      case '0': // 0 key - Jump to 0%
        if (isInputFocused()) return;
        player.seekTo(0, true);
        break;
      
      case '1': // 1 key - Jump to 10%
        if (isInputFocused()) return;
        const duration = player.getDuration();
        player.seekTo(duration * 0.1, true);
        break;
      
      case '2': // 2 key - Jump to 20%
        if (isInputFocused()) return;
        const duration2 = player.getDuration();
        player.seekTo(duration2 * 0.2, true);
        break;
      
      case '3': // 3 key - Jump to 30%
        if (isInputFocused()) return;
        const duration3 = player.getDuration();
        player.seekTo(duration3 * 0.3, true);
        break;
      
      case '4': // 4 key - Jump to 40%
        if (isInputFocused()) return;
        const duration4 = player.getDuration();
        player.seekTo(duration4 * 0.4, true);
        break;
      
      case '5': // 5 key - Jump to 50%
        if (isInputFocused()) return;
        const duration5 = player.getDuration();
        player.seekTo(duration5 * 0.5, true);
        break;
      
      case '6': // 6 key - Jump to 60%
        if (isInputFocused()) return;
        const duration6 = player.getDuration();
        player.seekTo(duration6 * 0.6, true);
        break;
      
      case '7': // 7 key - Jump to 70%
        if (isInputFocused()) return;
        const duration7 = player.getDuration();
        player.seekTo(duration7 * 0.7, true);
        break;
      
      case '8': // 8 key - Jump to 80%
        if (isInputFocused()) return;
        const duration8 = player.getDuration();
        player.seekTo(duration8 * 0.8, true);
        break;
      
      case '9': // 9 key - Jump to 90%
        if (isInputFocused()) return;
        const duration9 = player.getDuration();
        player.seekTo(duration9 * 0.9, true);
        break;
      
      case '?': // Question mark - Show shortcuts help
        setShowShortcuts(!showShortcuts);
        break;
      
      case 'Escape': // Escape - Hide shortcuts help
        setShowShortcuts(false);
        break;
      
      default:
        break;
    }
  }, [apiReady, player, showShortcuts]);

  // Load YouTube iframe API
  useEffect(() => {
    if (!video) return; // Early return if no video

    let scriptLoaded = false;

    // Load YouTube iframe API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      scriptLoaded = true;
    }

    // Initialize player when API is ready
    const initializePlayer = () => {
      if (window.YT && window.YT.Player && iframeRef.current) {
        try {
          const newPlayer = new window.YT.Player(iframeRef.current, {
          height: '100%',
          width: '100%',
          videoId: video.videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
              setApiReady(true);
              // Auto-seek to timestamp if present
              if (timestampParam) {
                const timestamp = parseInt(timestampParam);
                if (!isNaN(timestamp)) {
                  setTimeout(() => {
                    event.target.seekTo(timestamp, true);
                    event.target.playVideo();
                  }, 1000);
                }
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
              // Fallback to iframe method
              setApiReady(false);
              // Try to load the video using a simple iframe as fallback
              if (iframeRef.current && video) {
                const fallbackUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`;
                iframeRef.current.src = fallbackUrl;
            }
          },
        },
      });
        } catch (error) {
          console.error('Error initializing YouTube player:', error);
          // Fallback to simple iframe
          if (iframeRef.current && video) {
            const fallbackUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`;
            iframeRef.current.src = fallbackUrl;
          }
        }
      }
    };

    // Set up the API ready callback
    window.onYouTubeIframeAPIReady = initializePlayer;

    // If API is already loaded, initialize immediately
    if (window.YT && window.YT.Player) {
      initializePlayer();
    }

    // Add a timeout to ensure player loads
    const timeoutId = setTimeout(() => {
      if (!apiReady && iframeRef.current && video) {
        console.log('YouTube API timeout, using fallback iframe');
        const fallbackUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`;
        iframeRef.current.src = fallbackUrl;
      }
    }, 5000); // 5 second timeout

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
      if (player) {
        try {
        player.destroy();
        } catch (error) {
          console.error('Error destroying player:', error);
        }
      }
    };
  }, [video, timestampParam, handleKeyDown, player]);

  // Function to seek to timestamp in the video
  const seekToTimestamp = useCallback((timestamp) => {
    if (apiReady && player && player.seekTo) {
      try {
        player.seekTo(timestamp, true);
        player.playVideo();
      } catch (error) {
        console.error('Error seeking with API:', error);
        // Fallback to iframe method
        seekToTimestampFallback(timestamp);
      }
    } else {
      // Fallback to iframe src method
      seekToTimestampFallback(timestamp);
    }
  }, [apiReady, player]);

  // Fallback method using iframe src
  const seekToTimestampFallback = useCallback((timestamp) => {
    if (iframeRef.current && video) {
      const iframe = iframeRef.current;
      const url = `https://www.youtube.com/embed/${video.videoId}?start=${timestamp}&autoplay=1`;
      iframe.src = url;
    }
  }, [video]);

  // Function to open YouTube at specific timestamp
  const openYouTubeAtTimestamp = useCallback((timestamp) => {
    if (video) {
      const url = `https://www.youtube.com/watch?v=${video.videoId}&t=${timestamp}`;
      window.open(url, '_blank');
    }
  }, [video]);

  const handleAddNote = useCallback(async (timestamp, note) => {
    if (!video) return;
    
    try {
      const res = await axios.post('http://localhost:5000/bookmark', {
        videoId: video.videoId,
        videoTitle: video.videoTitle,
        timestamp,
        note,
      });
      setLocalNotes(res.data.video.notes);
      await fetchVideos(); // Refresh global videos state
    } catch (err) {
      alert('Failed to add note');
    }
  }, [video, fetchVideos]);

  const handleEditNote = useCallback(async (idx, newNote) => {
    try {
      const updated = [...localNotes];
      updated[idx].note = newNote;
      setLocalNotes(updated);
      await fetchVideos(); // Refresh global videos state
    } catch (err) {
      alert('Failed to edit note');
    }
  }, [localNotes, fetchVideos]);

  const handleDeleteNote = useCallback(async (idx) => {
    try {
      const updated = [...localNotes];
      updated.splice(idx, 1);
      setLocalNotes(updated);
      await fetchVideos(); // Refresh global videos state
    } catch (err) {
      alert('Failed to toggle like');
    }
  }, [localNotes, fetchVideos]);

  const handleLikeToggle = useCallback(async (idx, liked) => {
    try {
      console.log('=== NOTESPAGE HANDLE LIKE TOGGLE ===');
      console.log('Received idx:', idx, 'liked:', liked);
      console.log('Current localNotes:', localNotes);
      console.log('Note at index:', localNotes?.[idx]);
      
      const updated = [...localNotes];
      updated[idx].liked = liked;
      console.log('Updated note:', updated[idx]);
      
      setLocalNotes(updated);
      console.log('Local notes updated, calling fetchVideos...');
      
      await fetchVideos(); // Refresh global videos state
      console.log('FetchVideos completed');
    } catch (err) {
      console.error('NotesPage handleLikeToggle error:', err);
      alert('Failed to toggle like');
    }
  }, [localNotes, fetchVideos]);

  // Early return after all hooks
  if (!video) {
    return <div className="flex flex-col items-center justify-center h-full w-full text-gray-300">Video not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-5">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Back Button - Top Left */}
        <button
          onClick={() => navigate(-1)} 
          className="mb-8 youtube-button rounded-full px-6 py-2 self-start"
        >
          ← Back
        </button>

        {/* Video Section */}
        <div className="mb-8">
          {/* Video Player with proper aspect ratio */}
          <div className="w-full max-w-4xl mx-auto mb-6">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
              <div
                ref={iframeRef}
                className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg"
              ></div>
            </div>
          </div>

          {/* Video Title and Shortcuts Help */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white max-w-4xl leading-tight">
              {video.videoTitle}
            </h1>
            <div className="flex items-center gap-4">
              {apiReady && (
                <span className="text-sm text-gray-400">
                  Speed: {playbackRate}x
                </span>
              )}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
                className="p-2 text-gray-400 hover:text-gray-300 transition-colors"
                title="Keyboard Shortcuts (Press ?)"
          >
                <QuestionMarkCircleIcon className="w-6 h-6" />
          </button>
            </div>
          </div>
        </div>

          {/* Keyboard Shortcuts Modal */}
          {showShortcuts && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="youtube-card p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Space</span>
                  <span>Play/Pause</span>
                </div>
                <div className="flex justify-between">
                  <span>← →</span>
                  <span>Seek ±10s</span>
                </div>
                <div className="flex justify-between">
                  <span>↑ ↓</span>
                  <span>Volume ±10%</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift + &lt; &gt;</span>
                  <span>Speed Control</span>
                </div>
                <div className="flex justify-between">
                  <span>F</span>
                  <span>Toggle Fullscreen</span>
                </div>
                <div className="flex justify-between">
                  <span>M</span>
                  <span>Toggle Mute</span>
            </div>
                <div className="flex justify-between">
                  <span>C</span>
                  <span>Toggle Captions</span>
        </div>

                <div className="flex justify-between">
                  <span>0-9</span>
                  <span>Jump to 0%-90%</span>
                    </div>
                <div className="flex justify-between">
                  <span>?</span>
                  <span>Show/Hide Help</span>
                  </div>
                <div className="flex justify-between">
                  <span>B</span>
                  <span>Add Bookmark</span>
              </div>
              </div>
          </div>
          </div>
        )}

        {/* Notes List */}
        <div className="max-w-4xl mx-auto">
          <NotesList
            video={{ ...video, notes: localNotes }}
            onAddNote={handleAddNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onLikeToggle={handleLikeToggle}
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onTimestampClick={seekToTimestamp}
            onYouTubeClick={openYouTubeAtTimestamp}
          />
        </div>
      </div>
    </div>
  );
} 