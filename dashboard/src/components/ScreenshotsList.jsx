import React, { useState, useEffect } from "react";
import { Camera, Trash2, Clock, SortAsc, SortDesc, Play, ExternalLink, Maximize2, X, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/imageUtils";

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ScreenshotsList({ video, onScreenshotDelete, onTimestampClick, onYouTubeClick }) {
  const { authAxios } = useAuth();
  const [screenshots, setScreenshots] = useState([]);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);

  // Early return if video is not available
  if (!video || !video.videoId) {
    return (
      <div className="text-center py-12 youtube-card rounded-xl shadow-md border border-gray-700">
        <div className="text-gray-400">No video selected</div>
      </div>
    );
  }

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
    if (video && video.videoId) {
      fetchScreenshots();
    }
  }, [video?.videoId]);

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

      // Hide header when slideshow is active
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'none';
      }

      document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true);
        // Show header when slideshow is closed
        if (header) {
          header.style.display = '';
        }
      };
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

      // Hide header when fullscreen is active
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'none';
      }

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Show header when fullscreen is closed
        if (header) {
          header.style.display = '';
        }
      };
    }
  }, [fullscreenImage]);

  const fetchScreenshots = async () => {
    try {
      setLoading(true);
      console.log('🔍 Frontend: Fetching screenshots for video:', video?.videoId);
      
      const response = await authAxios.get(`/bookmark/${video.videoId}/screenshots`);
      console.log('🔍 Frontend: Screenshots response:', response.data);
      if (response.data.success) {
        setScreenshots(response.data.screenshots || []);
        console.log('🔍 Frontend: Set screenshots:', response.data.screenshots);
      }
    } catch (error) {
      console.error('Error fetching screenshots:', error);
      setScreenshots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScreenshot = async (screenshot) => {
    try {
      const response = await authAxios.delete(`/screenshots/${video.videoId}/${screenshot.timestamp}`);
      if (response.data.message) {
        // Refresh screenshots after deletion
        await fetchScreenshots();
        if (onScreenshotDelete) {
          onScreenshotDelete(screenshot.timestamp);
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Check if backend is available
  if (screenshots.length === 0 && !loading) {
    return (
      <div className="text-center py-12 youtube-card rounded-xl shadow-md border border-gray-700">
        <div className="text-gray-400">No screenshots found for this video.</div>
        <div className="text-gray-500 mt-2">Take screenshots while adding notes to see them here.</div>
      </div>
    );
  }

  return (
    <div className="w-full pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Camera className="w-6 h-6 text-primary" />
          Screenshots ({screenshots.length})
        </h3>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Slideshow Button */}
          {sortedScreenshots.length > 0 && (
            <button
              onClick={openSlideshow}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Play className="w-4 h-4" />
              Slideshow
            </button>
          )}
          
          {/* Sort Controls */}
          <div className="flex items-center gap-1  rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => handleSort('timestamp')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'timestamp' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-500 hover:text-gray-700'
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
                  ? 'bg-primary text-white' 
                  : 'text-gray-500 hover:text-gray-700'
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
        <div className="text-center py-12 youtube-card rounded-xl shadow-md border border-gray-700">
          <div className="text-gray-400">No screenshots found for this video.</div>
          <div className="text-gray-500 mt-2">Take screenshots while adding notes to see them here.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedScreenshots.map((screenshot, idx) => (
            <div key={idx} className="youtube-card rounded-xl shadow-md border border-gray-700 overflow-hidden">
              <div className="relative">
                <img
                  src={getImageUrl(screenshot.path)}
                  alt={`Screenshot at ${formatTimestamp(screenshot.timestamp)}`}
                  className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => openFullscreen(screenshot)}
                  onLoad={() => console.log('🔍 Frontend: Image loaded successfully:', screenshot.path)}
                  onError={(e) => {
                    console.log('🔍 Frontend: Image failed to load:', screenshot.path);
                    console.log('🔍 Frontend: Failed image src:', e.target.src);
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4MyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => openFullscreen(screenshot)}
                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                    title="View fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteScreenshot(screenshot)}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
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
                      className="inline-flex items-center gap-1 bg-purple-600 text-white font-mono px-3 py-1 rounded-lg text-sm hover:bg-purple-700 transition-colors cursor-pointer shadow-sm"
                      title="Play video at this timestamp"
                    >
                      <Play className="w-3 h-3" />
                      {formatTimestamp(screenshot.timestamp)}
                    </button>
                    <button
                      onClick={() => handleYouTubeClick(screenshot.timestamp)}
                      className="inline-flex items-center gap-1 p-1 text-purple-400 hover:text-purple-300 transition-colors hover:bg-purple-500/20 rounded"
                      title="Open in YouTube at this timestamp"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(screenshot.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-300 truncate">{video.videoTitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[9999999] flex items-center justify-center p-4 modal-overlay">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors z-10"
              title="Close (ESC)"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Screenshot Image */}
            <img
              src={getImageUrl(fullscreenImage.path)}
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
                className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[9999999] flex items-center justify-center p-4 modal-overlay">
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
              src={getImageUrl(sortedScreenshots[slideshowIndex].path)}
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
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((slideshowIndex + 1) / sortedScreenshots.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}