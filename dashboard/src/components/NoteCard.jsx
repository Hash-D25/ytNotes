import React, { useState, useEffect } from 'react';
import { ArrowTopRightOnSquareIcon, PhotoIcon, XMarkIcon, PlayIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { getImageUrl } from '../utils/imageUtils';

function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
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
  isVideoNotesPage = false,
}) {
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  
  // Improved truncation logic - only show for very long notes
  const shouldTruncate = note && note.length > 100; // Lower threshold for testing
  const collapsedHeight = 'max-h-16 overflow-hidden'; // 64px height for collapsed cards

  // Add keyboard support for the modal
  useEffect(() => {
    if (showScreenshotModal) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeScreenshotModal();
        }
      };

      // Hide header when screenshot modal is active
      const header = document.querySelector('header');
      if (header) {
        header.style.display = 'none';
      }

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Show header when screenshot modal is closed
        if (header) {
          header.style.display = '';
        }
      };
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

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    }
  };

  // Separate children into action buttons and link buttons
  const actionButtons = [];
  const linkButtons = [];
  
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === 'a' || child.props?.className?.includes('youtube-button')) {
        linkButtons.push(child);
      } else {
        actionButtons.push(child);
      }
    }
  });

  return (
    <>
      <div className={`youtube-card rounded-xl shadow-md border border-gray-700 hover:shadow-lg transition-shadow duration-300 p-6 ${className}`}>
        {showMeta && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2">
            {showTimestamp && (
              <div className="flex items-center gap-2">
                <span 
                  className="inline-block bg-purple-600 text-white font-mono px-3 py-1 rounded-lg text-sm cursor-pointer hover:bg-purple-700 transition-colors"
                  onClick={handleTimestampClick}
                  title="Click to play video at this timestamp"
                >
                  {timestamp}
                </span>
                {onYouTubeClick && (
                  <button
                    onClick={handleYouTubeClick}
                    className="p-1 text-gray-400 hover:text-purple-400 transition-colors"
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
                <span className="hidden sm:inline text-sm text-gray-400">•</span>
                <span className="text-sm text-purple-400 font-medium break-words">{videoTitle}</span>
              </>
            )}
            {showDate && createdAt && (
              <>
                <span className="hidden sm:inline text-sm text-gray-400">•</span>
                <span className="text-sm text-gray-400">
                  {new Date(createdAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        )}

        {isVideoNotesPage ? (
          // Special layout for video notes page
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Left side - Note content with responsive width */}
            <div className="flex-1 min-w-0">
              <div className="mb-4">
                {expanded ? (
                  <p className="text-gray-300 text-sm leading-relaxed break-words whitespace-pre-line min-w-0">{note}</p>
                ) : (
                  <div className={`${collapsedHeight}`}>
                    <p className="text-gray-300 text-sm leading-relaxed break-words whitespace-pre-line min-w-0">{note}</p>
                  </div>
                )}
                
                {/* Expand/Collapse Button - Positioned right after note content */}
                {shouldTruncate && (
                  <button
                    onClick={handleToggleExpand}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium mt-2"
                  >
                    {expanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            </div>

            {/* Right side - Screenshot and buttons with responsive width */}
            <div className="flex flex-col gap-4 w-full lg:w-40 flex-shrink-0">
              {/* Screenshot Thumbnail */}
              {screenshot && (
                <div className="relative inline-block w-full lg:w-auto">
                  <img
                    src={getImageUrl(screenshot.path)}
                    alt={`Screenshot at ${formatTimestamp(screenshot.timestamp)}`}
                    className="w-full lg:w-32 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={openScreenshotModal}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4MyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded mr-8">
                    <PhotoIcon className="w-3 h-3" />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {children && (
                <div className="flex items-center gap-2 justify-center lg:justify-start">
                  {actionButtons}
                  {linkButtons}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Original layout for other pages
          <>
            <div className="mb-4">
              {expanded ? (
                <p className="text-gray-300 text-sm leading-relaxed break-words whitespace-pre-line min-w-0">{note}</p>
              ) : (
                <div className={`${collapsedHeight}`}>
                  <p className="text-gray-300 text-sm leading-relaxed break-words whitespace-pre-line min-w-0">{note}</p>
                </div>
              )}
              
              {/* Expand/Collapse Button - Positioned right after note content */}
              {shouldTruncate && (
                <button
                  onClick={handleToggleExpand}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium mt-2"
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Action buttons container - positioned at bottom */}
            {children && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2 sm:gap-0">
                <div className="flex items-center gap-2">
                  {/* Left side - Action buttons (like, edit, delete, etc.) */}
                  {actionButtons}
                </div>
                
                {/* Right side - Go to Video button */}
                <div className="flex items-center gap-2">
                  {linkButtons}
                </div>
              </div>
            )}

            {/* Screenshot Thumbnail */}
            {screenshot && (
              <div className="mt-2">
                <div className="relative inline-block w-full sm:w-auto">
                  <img
                    src={getImageUrl(screenshot.path)}
                    alt={`Screenshot at ${formatTimestamp(screenshot.timestamp)}`}
                    className="w-full sm:w-32 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
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
          </>
        )}

        {/* Screenshot Modal - Now shows as in-app popup */}
        {showScreenshotModal && screenshot && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-[9999999] flex items-center justify-center p-4">
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
                  src={getImageUrl(screenshot.path)}
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
                    className="inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                    title="Play video at this timestamp"
                  >
                    <PlayIcon className="w-3 h-3" />
                    Play
                  </button>
                  <button
                    onClick={handleScreenshotYouTubeClick}
                    className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors"
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
      </div>
    </>
  );
}