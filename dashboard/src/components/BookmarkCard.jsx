import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

export default function BookmarkCard({ video, onFavoriteToggle }) {
  const thumbnail =
    video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;

  return (
    <div className="group bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-in-out relative overflow-hidden">
      {/* Heart Button */}
      <button
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
        onClick={() => onFavoriteToggle(video.videoId, !video.favorite)}
        aria-label={video.favorite ? 'Unfavorite' : 'Favorite'}
      >
        {video.favorite ? (
          <HeartSolid className="w-5 h-5 text-red-500" />
        ) : (
          <HeartOutline className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
        )}
      </button>

      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          src={thumbnail}
          alt={video.videoTitle}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
          {video.videoTitle}
        </h3>

        {/* Notes Count */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            {video.notes?.length || 0} note{video.notes?.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(video.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Show Notes Button */}
        <Link
  to={`/notes/${video.videoId}`}
  className="inline-block text-sm text-primary hover:underline transition duration-200"
>
  Show Notes
</Link>

      </div>
    </div>
  );
}
