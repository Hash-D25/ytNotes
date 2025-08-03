import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { ClockIcon, DocumentTextIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

export default function BookmarkCard({ video, onFavoriteToggle, onVideoDelete }) {
  const { authAxios } = useAuth();
  const thumbnail =
    video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this video and all its notes? This action cannot be undone.')) {
      try {
        console.log('🔧 Delete video - Using authenticated axios');
        const response = await authAxios.delete(`/videos/${video.videoId}`);
        if (response.data.success) {
          console.log('✅ Delete video successful');
          if (onVideoDelete) {
            onVideoDelete(video.videoId);
          }
        }
      } catch (err) {
        console.error('❌ Delete video failed:', err);
        alert(`Failed to delete video: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  return (
    <div className="youtube-card group overflow-hidden transition-all duration-300 hover:scale-[1.02] h-80 flex flex-col">
      {/* Thumbnail Container */}
      <div className="relative aspect-video overflow-hidden flex-shrink-0">
        <img
          src={thumbnail}
          alt={video.videoTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Favorite Button */}
        <button
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all duration-200 group-hover:scale-110"
          onClick={() => onFavoriteToggle(video.videoId, !video.favorite)}
          aria-label={video.favorite ? 'Unfavorite' : 'Favorite'}
        >
          {video.favorite ? (
            <HeartSolid className="w-5 h-5 text-red-500" />
          ) : (
            <HeartOutline className="w-5 h-5 text-white group-hover:text-red-400" />
          )}
        </button>

        {/* Delete Button */}
        <button
          className="absolute top-3 left-3 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-red-600/70 transition-all duration-200 group-hover:scale-110"
          onClick={handleDelete}
          aria-label="Delete video"
        >
          <TrashIcon className="w-5 h-5 text-white hover:text-red-400" />
        </button>

        {/* Video Duration Badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
          <ClockIcon className="w-3 h-3 inline mr-1" />
          {video.notes?.length || 0} notes
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="dark:text-white text-gray-900 font-medium text-sm line-clamp-2 mb-3 group-hover:text-red-400 transition-colors duration-200 flex-shrink-0">
          {video.videoTitle}
        </h3>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs dark:text-gray-400 text-gray-600 mb-4 flex-shrink-0">
          <div className="flex items-center space-x-1">
            <DocumentTextIcon className="w-3 h-3" />
            <span>{video.notes?.length || 0} notes</span>
          </div>
          <span>{formatDate(video.createdAt)}</span>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <Link
            to={`/notes/${video.videoId}`}
            className="youtube-button w-full text-center text-sm py-2 hover:bg-red-500 hover:text-white transition-all duration-200 block"
          >
            View Notes
          </Link>
        </div>
      </div>
    </div>
  );
}
