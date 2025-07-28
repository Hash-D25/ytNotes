import React, { useState, useEffect } from 'react';
import { ArrowTopRightOnSquareIcon, PhotoIcon, XMarkIcon, PlayIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function NoteCard({
  note,
  timestamp,
  videoTitle,
  createdAt,
  expanded,
  onToggleExpand,
  onTimestampClick,
  onYouTubeClick,
  children,
  showMeta = true,
  showTitle = true,
  showDate = true,
  showTimestamp = true,
  className = '',
  screenshot = null,
}) {
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const shouldTruncate = note.length > 200;
  const collapsedHeight = 'h-10'; // Fixed height for collapsed cards (128px)

  // Add keyboard support for the modal
  useEffect(() => {
    if (showScreenshotModal) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeScreenshotModal();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showScreenshotModal]);

  const handleTimestampClick = () => {
    if (onTimestampClick) {
      onTimestampClick();
    }
  };

  const handleYouTubeClick = (e) => {
    e.stopPropagation();
    if (onYouTubeClick) {
      onYouTubeClick();
    }
  };

  const openScreenshotModal = () => {
    setShowScreenshotModal(true);
  };

  const closeScreenshotModal = () => {
    setShowScreenshotModal(false);
  };

  const handleScreenshotTimestampClick = () => {
    if (onTimestampClick && screenshot) {
      onTimestampClick(screenshot.timestamp);
    }
  };

  const handleScreenshotYouTubeClick = () => {
    if (onYouTubeClick && screenshot) {
      onYouTubeClick(screenshot.timestamp);
    }
  };

  return (
    <>
      <div className={`youtube-card p-6 ${className}`}>
        {showMeta && (
          <div className="flex items-center gap-2 mb-4">
            {showTimestamp && (
              <div className="flex items-center gap-2">
                <span 
                  className="inline-block bg-youtube-red text-white font-mono px-3 py-1 rounded-lg text-sm cursor-pointer hover:bg-red-600 transition-colors"
                  onClick={handleTimestampClick}
                  title="Click to play video at this timestamp"
                >
                  {timestamp}
                </span>
                {onYouTubeClick && (
                  <button
                    onClick={handleYouTubeClick}
                    className="p-1 text-youtube-text-secondary hover:text-youtube-red transition-colors"
                    title="Open in YouTube at this timestamp"
                  >
                    <ArrowTopRightOnSquareIcon 
                      className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            {showTitle && videoTitle && (
              <>
                <span className="text-sm text-youtube-text-secondary">•</span>
                <span className="text-sm text-youtube-red font-medium">{videoTitle}</span>
              </>
            )}
            {showDate && createdAt && (
              <>
                <span className="text-sm text-youtube-text-secondary">•</span>
                <span className="text-sm text-youtube-text-secondary">
                  {new Date(createdAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        )}

        <div className="mb-4">
          {expanded ? (
            <p className="text-youtube-text text-sm leading-relaxed break-words whitespace-pre-line min-w-0">{note}</p>
          ) : (
            <div className={`${collapsedHeight} overflow-hidden`}>
              <p className="text-youtube-text text-sm leading-relaxed break-words whitespace-pre-line min-w-0">{note}</p>
            </div>
          )}
          {children}
        </div>

        {/* Screenshot Modal - Now shows as in-app popup */}
        {showScreenshotModal && screenshot && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-6xl w-full max-h-[90vh] overflow-hidden">
              {/* Close Button - Top Right */}
              <button
                onClick={closeScreenshotModal}
                className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors z-10"
                title="Close (ESC)"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              
              {/* Screenshot Image */}
              <div className="flex items-center justify-center h-full">
                <img
                  src={`http://localhost:5000${screenshot.path}`}
                  alt={`Screenshot at ${formatTimestamp(screenshot.timestamp)}`}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4MyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
              </div>
              
              {/* Info and Actions at Bottom */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                <div>
                  <div className="text-sm font-medium">
                    Screenshot taken at {formatTimestamp(screenshot.timestamp)}
                  </div>
                  <div className="text-xs text-gray-300">
                    {new Date(screenshot.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleScreenshotTimestampClick}
                    className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    title="Play video at this timestamp"
                  >
                    <PlayIcon className="w-3 h-3" />
                    Play
                  </button>
                  <button
                    onClick={handleScreenshotYouTubeClick}
                    className="inline-flex items-center gap-1 bg-youtube-red text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
                    title="Open in YouTube"
                  >
                    <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    YouTube
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Screenshot Thumbnail */}
        {screenshot && (
          <div className="mt-4">
            <div className="relative inline-block">
              <img
                src={`http://localhost:5000${screenshot.path}`}
                alt={`Screenshot at ${formatTimestamp(screenshot.timestamp)}`}
                className="w-32 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={openScreenshotModal}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4MyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                }}
              />
              <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                <PhotoIcon className="w-3 h-3" />
              </div>
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        {shouldTruncate && (
          <button
            onClick={onToggleExpand}
            className="text-youtube-red hover:text-red-600 text-sm font-medium mt-2 transition-colors"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </>
  );
} 