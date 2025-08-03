import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import NoteCard from './NoteCard';
import BookmarkCard from './BookmarkCard';

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

export default function FavoritesPage({
  videos,
  fetchVideos,
  onFavoriteToggle,
  onVideoDelete,
  search,
  setSearch,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) {
  const { authAxios } = useAuth();
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [activeTab, setActiveTab] = useState('videos');
  const navigate = useNavigate();

  const toggleNoteExpansion = (idx) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) newSet.delete(idx); else newSet.add(idx);
      return newSet;
    });
  };

  const handleEditNote = async (idx, newNote) => {
    try {
      console.log('🔧 Edit note - Using authenticated axios');
      const response = await authAxios.patch(
        `/bookmark/${videos[idx].videoId}/${idx}`,
        {
          note: newNote,
        }
      );
      if (response.data.success) {
        console.log('✅ Edit note successful');
        fetchVideos();
      }
    } catch (err) {
      console.error('❌ Edit note failed:', err);
      alert(`Failed to edit note: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteNote = async (idx) => {
    try {
      console.log('🔧 Delete note - Using authenticated axios');
      const response = await authAxios.delete(
        `/bookmark/${videos[idx].videoId}/${idx}`
      );
      if (response.data.success) {
        console.log('✅ Delete note successful');
        // Check if video was deleted (no content left)
        if (response.data.videoDeleted) {
          console.log('Video deleted due to no content left');
        }
        fetchVideos();
      }
    } catch (err) {
      console.error('❌ Delete note failed:', err);
      alert(`Failed to delete note: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleLikeToggle = async (note, liked) => {
    try {
      console.log('Toggling like for note:', note.videoId, note.noteIndex, 'from', liked, 'to', !liked);
      
      console.log('🔧 Like toggle - Using authenticated axios');
      const response = await authAxios.patch(
        `/bookmark/${note.videoId}/${note.noteIndex}/like`,
        {
          liked: !liked,
        }
      );
      if (response.data.success) {
        console.log('✅ Like toggle successful, refreshing videos');
        fetchVideos();
      }
    } catch (err) {
      console.error('Like toggle error:', err);
      alert(`Failed to toggle like: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleTimestampClick = (note) => {
    // Navigate to NotesList page with timestamp parameter
    navigate(`/notes/${note.videoId}?t=${note.timestamp}`);
  };

  const handleYouTubeClick = (note) => {
    const url = `https://www.youtube.com/watch?v=${note.videoId}&t=${note.timestamp}`;
    window.open(url, '_blank');
  };

  // Get all favorite videos
  const favoriteVideos = useMemo(() => {
    return videos.filter(video => video.favorite);
  }, [videos]);

  // Get all favorite notes from all videos
  const allFavoriteNotes = useMemo(() => {
    return videos.flatMap(video => 
      video.notes
        .map((note, noteIndex) => ({ ...note, noteIndex })) // Add index to all notes
        .filter(note => note.liked) // Then filter for liked notes
        .map(note => ({
          ...note,
          videoId: video.videoId,
          videoTitle: video.videoTitle,
          videoCreatedAt: video.createdAt,
        }))
    );
  }, [videos]);

  // Filter and sort favorite notes
  const filteredFavoriteNotes = useMemo(() => {
    let filtered = allFavoriteNotes.filter(note => 
      note.note.toLowerCase().includes(search.toLowerCase()) ||
      note.videoTitle.toLowerCase().includes(search.toLowerCase())
    );

    const sortMultiplier = sortOrder === 'asc' ? 1 : -1;

    switch (sortBy) {
      case 'timestamp':
        return filtered.sort((a, b) => (a.timestamp - b.timestamp) * sortMultiplier);
      case 'title':
        return filtered.sort((a, b) => a.videoTitle.localeCompare(b.videoTitle) * sortMultiplier);
      case 'createdAt':
        return filtered.sort((a, b) => (new Date(b.videoCreatedAt) - new Date(a.videoCreatedAt)) * sortMultiplier);
      default:
        return filtered.sort((a, b) => (new Date(b.videoCreatedAt) - new Date(a.videoCreatedAt)) * sortMultiplier);
    }
  }, [allFavoriteNotes, search, sortBy, sortOrder]);

  const totalFavoriteVideos = favoriteVideos.length;
  const totalFavoriteNotes = allFavoriteNotes.length;

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50">
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">
            Favorites
          </h1>
          <p className="text-gray-400 text-lg">
            Your favorite videos and notes
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="youtube-card p-6 text-center">
            <div className="text-3xl font-bold dark:text-white text-gray-900 mb-2">{totalFavoriteVideos}</div>
            <div className="text-gray-400">Favorite Videos</div>
          </div>
          <div className="youtube-card p-6 text-center">
            <div className="text-3xl font-bold dark:text-white text-gray-900 mb-2">{totalFavoriteNotes}</div>
            <div className="text-gray-400">Favorite Notes</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 mb-8">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'videos'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Videos
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Notes
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'videos' ? (
          // Favorite Videos Tab
          <div className="pb-8">
            {search && (
              <div className="mb-6 text-gray-400 text-sm text-center">
                Showing {favoriteVideos.length} favorite videos matching "{search}"
              </div>
            )}
            {favoriteVideos.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-400 text-6xl mb-6">❤️</div>
                <h3 className="text-2xl font-semibold dark:text-white text-gray-900 mb-2">No favorite videos yet</h3>
                <p className="text-gray-400">
                  Start favoriting videos to see them here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                {favoriteVideos.map((video, index) => (
                  <div key={video.videoId} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <BookmarkCard
                      video={video}
                      onFavoriteToggle={onFavoriteToggle}
                      onVideoDelete={onVideoDelete}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Favorite Notes Tab
          <div className="pb-8">
            {search && (
              <div className="mb-6 text-gray-400 text-sm text-center">
                Showing {filteredFavoriteNotes.length} favorite notes matching "{search}"
              </div>
            )}
            {filteredFavoriteNotes.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-400 text-6xl mb-6">📝</div>
                <h3 className="text-2xl font-semibold dark:text-white text-gray-900 mb-2">No favorite notes yet</h3>
                <p className="text-gray-400">
                  Start liking notes to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {filteredFavoriteNotes.map((note, index) => (
                  <div key={`${note.videoId}-${note.noteIndex}`} className="animate-slide-up relative" style={{ animationDelay: `${index * 50}ms` }}>
                    {/* Like button positioned at top right */}
                    <button
                      onClick={() => handleLikeToggle(note, note.liked)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors duration-200 z-10"
                      title="Unlike"
                    >
                      <HeartIcon className="w-4 h-4 text-red-500" />
                    </button>
                    
                    <NoteCard
                      note={note.note}
                      timestamp={formatTimestamp(note.timestamp)}
                      videoTitle={note.videoTitle}
                      createdAt={new Date(note.createdAt).toLocaleDateString()}
                      expanded={expandedNotes.has(index)}
                      onToggleExpand={() => toggleNoteExpansion(index)}
                      onTimestampClick={() => handleTimestampClick(note)}
                      onYouTubeClick={() => handleYouTubeClick(note)}
                    >
                      <Link
                        to={`/notes/${note.videoId}`}
                        className="flex justify-end text-purple-400 hover:text-purple-300 text-sm transition-colors duration-200"
                      >
                        View Video →
                      </Link>
                    </NoteCard>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}