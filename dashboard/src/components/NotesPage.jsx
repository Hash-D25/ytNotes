import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeftIcon, PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";
import { KeyboardIcon } from "lucide-react";
import axios from "axios";
import ScreenshotsList from "./ScreenshotsList";

export default function NotesPage({ videos, fetchVideos, search, setSearch, sortBy, setSortBy, sortOrder, setSortOrder }) {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playerRef = useRef(null);

  const video = videos.find((v) => v.videoId === videoId);

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      const newPlayer = new window.YT.Player(playerRef.current, {
        height: "360",
        width: "100%",
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
            setDuration(event.target.getDuration());
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (player) {
      const interval = setInterval(() => {
        setCurrentTime(player.getCurrentTime());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [player]);

  useEffect(() => {
    // Handle timestamp parameter from URL
    const params = new URLSearchParams(location.search);
    const timestamp = params.get("t");
    if (timestamp && player) {
      const seconds = parseTimestamp(timestamp);
      player.seekTo(seconds);
      player.playVideo();
    }
  }, [player, location.search]);

  const parseTimestamp = (timestamp) => {
    const parts = timestamp.split(":");
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(timestamp);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  };

  const seekTo = (seconds) => {
    if (player) {
      player.seekTo(seconds);
    }
  };

  const toggleMute = () => {
    if (player) {
      if (isMuted) {
        player.unMute();
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    }
  };

  const setPlaybackRateHandler = (rate) => {
    if (player) {
      player.setPlaybackRate(rate);
      setPlaybackRate(rate);
    }
  };

  const handleKeyPress = (e) => {
    if (!player) return;

    switch (e.key) {
      case " ":
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowLeft":
        e.preventDefault();
        seekTo(currentTime - 10);
        break;
      case "ArrowRight":
        e.preventDefault();
        seekTo(currentTime + 10);
        break;
      case "ArrowUp":
        e.preventDefault();
        const newVolume = Math.min(100, volume + 10);
        setVolume(newVolume);
        player.setVolume(newVolume);
        break;
      case "ArrowDown":
        e.preventDefault();
        const lowerVolume = Math.max(0, volume - 10);
        setVolume(lowerVolume);
        player.setVolume(lowerVolume);
        break;
      case "m":
      case "M":
        e.preventDefault();
        toggleMute();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [currentTime, volume, isMuted, player]);

  if (!video) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-white mb-2">Video not found</h2>
          <p className="text-gray-400 mb-6">The video you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/")}
            className="youtube-button hover:bg-purple-500 hover:text-white transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="youtube-button mb-6 hover:bg-purple-500 hover:text-white transition-all duration-200"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back
        </button>

        {/* Video Player */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-youtube-hover">
            <div ref={playerRef} className="w-full"></div>
          </div>
          
          {/* Video Info */}
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-white mb-2">{video.videoTitle}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Current Time: {formatTime(currentTime)}</span>
              <span>Duration: {formatTime(duration)}</span>
              <span>Speed: {playbackRate}x</span>
            </div>
          </div>

          {/* Keyboard Shortcuts Button */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="youtube-button mt-4 hover:bg-purple-500 hover:text-white transition-all duration-200"
          >
            <KeyboardIcon className="w-4 h-4 mr-2" />
            Keyboard Shortcuts
          </button>

          {/* Keyboard Shortcuts Modal */}
          {showShortcuts && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="youtube-card p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold text-white mb-4">Keyboard Shortcuts</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Space</span>
                    <span className="text-gray-400">Play/Pause</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">← →</span>
                    <span className="text-gray-400">Seek 10s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">↑ ↓</span>
                    <span className="text-gray-400">Volume</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">M</span>
                    <span className="text-gray-400">Mute/Unmute</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="youtube-button w-full mt-4 hover:bg-purple-500 hover:text-white transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notes and Screenshots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Notes Section */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Notes</h2>
            {video.notes && video.notes.length > 0 ? (
              <div className="space-y-4">
                {video.notes.map((note, index) => (
                  <div key={index} className="youtube-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        onClick={() => seekTo(note.timestamp)}
                        className="px-3 py-1 bg-purple-500 text-white text-xs rounded-full hover:bg-purple-600 transition-colors duration-200"
                      >
                        {note.timestamp}
                      </button>
                      <span className="text-xs text-gray-400">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{note.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <p className="text-gray-400">No notes for this video yet.</p>
              </div>
            )}
          </div>

          {/* Screenshots Section */}
          <div>
            <ScreenshotsList videoId={videoId} />
          </div>
        </div>
      </div>
    </div>
  );
} 