import React from 'react';
import { ArrowTopRightOnSquareIcon
 } from '@heroicons/react/24/outline';

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
}) {
  const shouldTruncate = note.length > 200;
  const collapsedHeight = 'h-10'; // Fixed height for collapsed cards (128px)

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

  return (
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
  );
} 