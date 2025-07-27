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
    console.log('Opening screenshot modal for:', screenshot);
    setShowScreenshotModal(true);
  };

  const closeScreenshotModal = () => {
    console.log('Closing screenshot modal');
    setShowScreenshotModal(false);
  };

  const handleScreenshotTimestampClick = () => {
    console.log('Screenshot timestamp click:', screenshot?.timestamp);
    if (onTimestampClick && screenshot) {
      onTimestampClick(screenshot.timestamp);
    }
  };

  const handleScreenshotYouTubeClick = () => {
    console.log('Screenshot YouTube click:', screenshot?.timestamp);
    if (onYouTubeClick && screenshot) {
      onYouTubeClick(screenshot.timestamp);
    }
  };

  return (
    <>
      <div className={`bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-300 p-6 ${className}`}>
        {showMeta && (
          <div className="flex items-center gap-2 mb-2">
            {showTimestamp && (
              <div className="flex items-center gap-2">
                <span 
                  className="inline-block bg-red-300 text-white font-mono px-3 py-1 rounded-lg text-sm cursor-pointer hover:bg-red-400 transition-colors"
                  onClick={handleTimestampClick}
                  title="Click to play video at this timestamp"
                >
                  {timestamp}
                </span>
                {onYouTubeClick && (
                  <button
                    onClick={handleYouTubeClick}
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
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
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-primary font-medium">{videoTitle}</span>
              </>
            )}
            {showDate && createdAt && (
              <span className="text-xs text-gray-500 ml-2">{createdAt}</span>
            )}
            {/* Screenshot indicator */}
            {screenshot && (
              <button
                onClick={openScreenshotModal}
                className="ml-auto flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs hover:bg-blue-200 transition-colors"
                title="View screenshot"
              >
                <PhotoIcon className="w-3 h-3" />
                Screenshot
              </button>
            )}
          </div>
        )}
        {/* Responsive note box with Read More/Read Less */}
        {shouldTruncate && !expanded ? (
          <div className={`relative ${collapsedHeight} overflow-hidden transition-all duration-300 min-w-0`}>
            <p className="text-gray-800 text-sm leading-relaxed break-words whitespace-pre-line">{note}</p>
            <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white pointer-events-none" />
            <button
              onClick={onToggleExpand}
              className="absolute right-4 bottom-2 z-10 text-primary text-xs mt-2 hover:text-primary/80 font-medium bg-white/80 px-2 py-1 rounded shadow"
            >
              Read More
            </button>
          </div>
        ) : shouldTruncate && expanded ? (
          <div className="max-h-[600px] overflow-auto transition-all duration-300 min-w-0">
            <p className="text-gray-800 text-sm leading-relaxed break-words whitespace-pre-line">{note}</p>
            <button
              onClick={onToggleExpand}
              className="text-primary text-xs mt-2 hover:text-primary/80 font-medium"
            >
              Read Less
            </button>
          </div>
        ) : (
          <div className={`${collapsedHeight} overflow-hidden`}>
            <p className="text-gray-800 text-sm leading-relaxed break-words whitespace-pre-line min-w-0">{note}</p>
          </div>
        )}
        {children}
      </div>

      {/* Screenshot Modal */}
      {showScreenshotModal && screenshot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PhotoIcon className="w-5 h-5 text-blue-600" />
                Note with Screenshot
              </h3>
              <button
                onClick={closeScreenshotModal}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
                title="Close (ESC)"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col lg:flex-row h-full">
              {/* Left Side - Note */}
              <div className="lg:w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
                <div className="space-y-4">
                  {/* Note Meta */}
                  <div className="flex items-center gap-2">
                    <span className="inline-block bg-blue-600 text-white font-mono px-3 py-1 rounded-lg text-sm">
                      {formatTimestamp(screenshot.timestamp)}
                    </span>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-primary font-medium">{videoTitle}</span>
                    <span className="text-xs text-gray-500 ml-2">{createdAt}</span>
                  </div>

                  {/* Note Content */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800 text-sm leading-relaxed break-words whitespace-pre-line">
                      {note}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleScreenshotTimestampClick}
                      className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      <PlayIcon className="w-4 h-4" />
                      Play at {formatTimestamp(screenshot.timestamp)}
                    </button>
                    <button
                      onClick={handleScreenshotYouTubeClick}
                      className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      Open in YouTube
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Side - Screenshot */}
              <div className="lg:w-1/2 p-6 flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative max-w-full max-h-full">
                    <img
                      src={`http://localhost:5000${screenshot.path}`}
                      alt={`Screenshot at ${formatTimestamp(screenshot.timestamp)}`}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4MyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    <button
                      onClick={() => window.open(`http://localhost:5000${screenshot.path}`, '_blank')}
                      className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
                      title="Open in full size"
                    >
                      <ArrowsPointingOutIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Screenshot Info */}
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-600">
                    Screenshot taken at {formatTimestamp(screenshot.timestamp)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(screenshot.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 