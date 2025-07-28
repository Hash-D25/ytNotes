import React, { useState, useEffect } from "react";
import { Camera, Trash2, Clock, SortAsc, SortDesc, Play, ExternalLink, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ScreenshotsList({ video, onScreenshotDelete, onTimestampClick, onYouTubeClick }) {
  const [screenshots, setScreenshots] = useState([]);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

  // Define sortedScreenshots before using it in useEffect
  const sortedScreenshots = [...screenshots].sort((a, b) => {
    const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'timestamp':
        return (a.timestamp - b.timestamp) * sortMultiplier;
      case 'createdAt':
      default:
        return (new Date(b.createdAt) - new Date(a.createdAt)) * sortMultiplier;
    }
  });

  useEffect(() => {
    fetchScreenshots();
  }, [video.videoId]);

  useEffect(() => {
    if (isSlideshowOpen) {
      const handleKeyDown = (e) => {
        // Prevent any arrow key events from reaching the YouTube player when slideshow is open
        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
        }
        
        switch (e.key) {
          case 'ArrowRight':
          case ' ':
            handleNext();
            break;
          case 'ArrowLeft':
            handlePrev();
            break;
          case 'Escape':
            closeSlideshow();
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isSlideshowOpen, slideshowIndex, sortedScreenshots.length]);

  useEffect(() => {
    if (fullscreenImage) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeFullscreen();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [fullscreenImage]);

  const fetchScreenshots = async () => {
    try {
      setLoading(true);
      console.log('Fetching screenshots for video:', video.videoId);
      const response = await axios.get(`http://localhost:5000/bookmark/${video.videoId}/screenshots`);
      console.log('Screenshots response:', response.data);
      if (response.data.success) {
        setScreenshots(response.data.screenshots || []);
      }
    } catch (error) {
      console.error('Error fetching screenshots:', error);
      setScreenshots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScreenshot = async (idx) => {
    try {
      const response = await axios.delete(`http://localhost:5000/bookmark/${video.videoId}/screenshots/${idx}`);
      if (response.data.success) {
        setScreenshots(response.data.video.screenshots || []);
        if (onScreenshotDelete) {
          onScreenshotDelete(idx);
        }
      }
    } catch (error) {
      console.error('Error deleting screenshot:', error);
      alert('Failed to delete screenshot');
    }
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handleTimestampClick = (timestamp) => {
    if (onTimestampClick && timestamp !== undefined) {
      onTimestampClick(timestamp);
    }
  };

  const handleYouTubeClick = (timestamp) => {
    if (onYouTubeClick && timestamp !== undefined) {
      onYouTubeClick(timestamp);
    }
  };

  const openFullscreen = (screenshot) => {
    if (screenshot) {
      setFullscreenImage(screenshot);
    }
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const openSlideshow = () => {
    if (sortedScreenshots && sortedScreenshots.length > 0) {
      setSlideshowIndex(0);
      setIsSlideshowOpen(true);
    }
  };

  const closeSlideshow = () => {
    setIsSlideshowOpen(false);
    setSlideshowIndex(0);
  };

  const handleNext = () => {
    if (sortedScreenshots && sortedScreenshots.length > 0) {
      setSlideshowIndex((prev) => 
        prev === sortedScreenshots.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrev = () => {
    if (sortedScreenshots && sortedScreenshots.length > 0) {
      setSlideshowIndex((prev) => 
        prev === 0 ? sortedScreenshots.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="w-full pb-16">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-youtube-red"></div>
        </div>
      </div>
    );
  }

  // Check if video exists
  if (!video || !video.videoId) {
    return (
      <div className="w-full pb-16">
        <div className="text-center py-12 youtube-card">
          <Camera className="w-12 h-12 text-youtube-text-secondary mx-auto mb-4" />
          <p className="text-youtube-text-secondary text-lg">
            No video selected or video not found.
          </p>
        </div>
      </div>
    );
  }

  // Check if backend is available
  if (screenshots.length === 0 && !loading) {
    return (
      <div className="w-full pb-16">
        <div className="text-center py-12 youtube-card">
          <Camera className="w-12 h-12 text-youtube-text-secondary mx-auto mb-4" />
          <p className="text-youtube-text-secondary text-lg">
            No screenshots found for this video.
          </p>
          <p className="text-sm text-youtube-text-secondary mt-2">
            Take screenshots while adding notes to see them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-youtube-text flex items-center gap-2">
          <Camera className="w-6 h-6 text-youtube-red" />
          Screenshots ({screenshots.length})
        </h3>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Slideshow Button */}
          {sortedScreenshots.length > 0 && (
            <button
              onClick={openSlideshow}
              className="youtube-button flex items-center gap-1 px-4 py-2 hover:bg-youtube-red hover:text-white transition-all duration-200 text-sm font-medium"
            >
              <Play className="w-4 h-4" />
              Slideshow
            </button>
          )}
          
          {/* Sort Controls */}
          <div className="flex items-center gap-1 youtube-card p-1">
            <button
              onClick={() => handleSort('timestamp')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'timestamp' 
                  ? 'bg-youtube-red text-white' 
                  : 'text-youtube-text-secondary hover:text-youtube-text'
              }`}
            >
              <Clock className="w-4 h-4" />
              Time
              {sortBy === 'timestamp' && (
                sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={() => handleSort('createdAt')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'createdAt' 
                  ? 'bg-youtube-red text-white' 
                  : 'text-youtube-text-secondary hover:text-youtube-text'
              }`}
            >
              Date
              {sortBy === 'createdAt' && (
                sortOrder === 'asc' ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Screenshots Grid */}
      {screenshots.length === 0 ? (
        <div className="text-center py-12 youtube-card">
          <Camera className="w-12 h-12 text-youtube-text-secondary mx-auto mb-4" />
          <p className="text-youtube-text-secondary text-lg">
            No screenshots found for this video.
          </p>
          <p className="text-sm text-youtube-text-secondary mt-2">
            Take screenshots while adding notes to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedScreenshots.map((screenshot, idx) => (
            <div key={idx} className="youtube-card overflow-hidden animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="relative">
                <img
                  src={`http://localhost:5000${screenshot.path}`}
                  alt={`Screenshot at ${formatTimestamp(screenshot.timestamp)}`}
                  className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => openFullscreen(screenshot)}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4MyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => openFullscreen(screenshot)}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                    title="View fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteScreenshot(idx)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                    title="Delete screenshot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTimestampClick(screenshot.timestamp)}
                      className="inline-flex items-center gap-1 bg-youtube-red text-white font-mono px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors cursor-pointer shadow-sm"
                      title="Play video at this timestamp"
                    >
                      <Play className="w-3 h-3" />
                      {formatTimestamp(screenshot.timestamp)}
                    </button>
                    <button
                      onClick={() => handleYouTubeClick(screenshot.timestamp)}
                      className="inline-flex items-center gap-1 p-1 text-youtube-red hover:text-red-600 transition-colors hover:bg-youtube-red/20 rounded"
                      title="Open in YouTube at this timestamp"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-youtube-text-secondary">
                    {new Date(screenshot.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-youtube-text truncate">{video.videoTitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Modal - Now shows as in-app popup instead of new tab */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button - Top Right */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors z-10"
              title="Close (ESC)"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Screenshot Image */}
            <img
              src={`http://localhost:5000${fullscreenImage.path}`}
              alt={`Screenshot at ${formatTimestamp(fullscreenImage.timestamp)}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Info at Bottom Left */}
            <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded-lg">
              <div className="text-sm font-medium">
                {formatTimestamp(fullscreenImage.timestamp)}
              </div>
              <div className="text-xs text-gray-300">
                {new Date(fullscreenImage.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            {/* Action Buttons at Bottom Right */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={() => handleTimestampClick(fullscreenImage.timestamp)}
                className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                title="Play video at this timestamp"
              >
                <Play className="w-3 h-3" />
                Play
              </button>
              <button
                onClick={() => handleYouTubeClick(fullscreenImage.timestamp)}
                className="inline-flex items-center gap-1 bg-youtube-red text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
                title="Open in YouTube"
              >
                <ExternalLink className="w-3 h-3" />
                YouTube
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slideshow Modal */}
      {isSlideshowOpen && sortedScreenshots.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeSlideshow}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors z-10"
              title="Close slideshow (ESC)"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors z-10"
              title="Previous (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors z-10"
              title="Next (→ or Space)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Image */}
            <img
              src={`http://localhost:5000${sortedScreenshots[slideshowIndex].path}`}
              alt={`Screenshot ${slideshowIndex + 1} of ${sortedScreenshots.length}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Counter and Info */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              <div className="text-center">
                <div className="text-sm font-medium">
                  {slideshowIndex + 1} of {sortedScreenshots.length}
                </div>
                <div className="text-xs text-gray-300">
                  {formatTimestamp(sortedScreenshots[slideshowIndex].timestamp)}
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts Info */}
            <div className="absolute bottom-4 right-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded-lg text-xs">
              <div className="font-medium mb-1">Keyboard Shortcuts:</div>
              <div>← → or Space: Navigate</div>
              <div>ESC: Close</div>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-30">
              <div 
                className="h-full bg-youtube-red transition-all duration-300"
                style={{ width: `${((slideshowIndex + 1) / sortedScreenshots.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 