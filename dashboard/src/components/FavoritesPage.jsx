import React, { useState } from "react";
import { HeartIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import NoteCard from "./NoteCard";
import axios from "axios";

export default function FavoritesPage({
  videos,
  fetchVideos,
  onFavoriteToggle,
  search,
  setSearch,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) {
  const [activeTab, setActiveTab] = useState("videos");
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [editingIdx, setEditingIdx] = useState(null);
  const [editNote, setEditNote] = useState("");
  const navigate = useNavigate();

  const toggleNoteExpansion = (idx) => {
    setExpandedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) newSet.delete(idx);
      else newSet.add(idx);
      return newSet;
    });
  };

  const handleEditNote = async (idx, newNote) => {
    try {
      const note = allFavoriteNotes[idx];
      const response = await axios.patch(
        `http://localhost:5000/bookmark/${note.videoId}/${note.noteIndex}`,
        {
          note: newNote,
        }
      );
      if (response.data.success) {
        await fetchVideos(); // Refresh global videos state
        setEditingIdx(null);
      }
    } catch (err) {
      alert("Failed to edit note");
    }
  };

  const handleDeleteNote = async (idx) => {
    try {
      const note = allFavoriteNotes[idx];
      const response = await axios.delete(
        `http://localhost:5000/bookmark/${note.videoId}/${note.noteIndex}`
      );
      if (response.data.success) {
        await fetchVideos(); // Refresh global videos state
      }
    } catch (err) {
      alert("Failed to delete note");
    }
  };

  const handleLikeToggle = async (idx, liked) => {
    try {
      const note = allFavoriteNotes[idx];
      const response = await axios.patch(
        `http://localhost:5000/bookmark/${note.videoId}/${note.noteIndex}/like`,
        {
          liked: !liked,
        }
      );
      if (response.data.success) {
        await fetchVideos(); // Refresh global videos state
      }
    } catch (err) {
      alert("Failed to toggle like");
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

  // Get all favorite videos with search filter and sorting
  const favoriteVideos = videos
    .filter((v) => v.favorite)
    .filter((v) => v.videoTitle.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'title':
          return a.videoTitle.localeCompare(b.videoTitle) * sortMultiplier;
        case 'favorite':
          return (new Date(b.createdAt) - new Date(a.createdAt)) * sortMultiplier;
        case 'createdAt':
        default:
          return (new Date(b.createdAt) - new Date(a.createdAt)) * sortMultiplier;
      }
    });

  // Get all favorite notes from all videos with their indices, search filter and sorting
  const allFavoriteNotes = videos
    .flatMap((video) =>
      video.notes.map((note, noteIndex) => ({
        ...note,
        videoId: video.videoId,
        videoTitle: video.videoTitle,
        noteIndex,
      }))
    )
    .filter((note) => note.liked === true)
    .filter((note) => 
      note.note.toLowerCase().includes(search.toLowerCase()) ||
      note.videoTitle.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'title':
          return a.videoTitle.localeCompare(b.videoTitle) * sortMultiplier;
        case 'favorite':
          return (new Date(b.createdAt) - new Date(a.createdAt)) * sortMultiplier;
        case 'createdAt':
        default:
          return (new Date(b.createdAt) - new Date(a.createdAt)) * sortMultiplier;
      }
    });

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">
              Favorites
            </h1>
            <p className="text-gray-400 text-lg">
              Your most loved videos and notes
            </p>
          </div>

          {/* Tab Buttons */}
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setActiveTab("videos")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === "videos"
                  ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg"
                  : "youtube-button hover:bg-gray-600"
              }`}
            >
              Favorite Videos ({favoriteVideos?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab("notes")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === "notes"
                  ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg"
                  : "youtube-button hover:bg-gray-600"
              }`}
            >
              Favorite Notes ({allFavoriteNotes?.length || 0})
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "videos" ? (
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
                <h3 className="text-2xl font-semibold text-white mb-2">No favorite videos yet</h3>
                <p className="text-gray-400">
                  Start favoriting videos to see them here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                {favoriteVideos.map((video, index) => (
                  <div key={video.videoId} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="youtube-card group overflow-hidden transition-all duration-300 hover:scale-[1.02]">
                      {/* Thumbnail */}
                      <div className="relative aspect-video overflow-hidden">
                        <img
                          src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                          alt={video.videoTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Favorite Button */}
                        <button
                          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all duration-200"
                          onClick={() => onFavoriteToggle(video.videoId, !video.favorite)}
                          aria-label="Unfavorite"
                        >
                          <HeartIcon className="w-5 h-5 text-red-500" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="text-white font-medium text-sm line-clamp-2 mb-3 group-hover:text-purple-400 transition-colors duration-200">
                          {video.videoTitle}
                        </h3>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                          <span>{video.notes?.length || 0} notes</span>
                          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                        </div>

                        <Link
                          to={`/notes/${video.videoId}`}
                          className="youtube-button w-full text-center text-sm py-2 hover:bg-purple-500 hover:text-white transition-all duration-200"
                        >
                          View Notes
                        </Link>
                      </div>
                    </div>
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
                Showing {allFavoriteNotes.length} favorite notes matching "{search}"
              </div>
            )}
            {allFavoriteNotes.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-400 text-6xl mb-6">📝</div>
                <h3 className="text-2xl font-semibold text-white mb-2">No favorite notes yet</h3>
                <p className="text-gray-400">
                  Start liking notes to see them here
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                {allFavoriteNotes.map((note, index) => (
                  <div key={`${note.videoId}-${note.noteIndex}`} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="youtube-card p-6">
                      {/* Note Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-2">{note.videoTitle}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Note {note.noteIndex + 1}</span>
                            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleLikeToggle(index, note.liked)}
                            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors duration-200"
                            title="Unlike"
                          >
                            <HeartIcon className="w-4 h-4 text-red-500" />
                          </button>
                          
                          <button
                            onClick={() => handleTimestampClick(note)}
                            className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors duration-200"
                            title="Go to timestamp"
                          >
                            <ArrowTopRightOnSquareIcon className="w-4 h-4 text-purple-400" />
                          </button>
                          
                          <button
                            onClick={() => handleYouTubeClick(note)}
                            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors duration-200"
                            title="Open on YouTube"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Note Content */}
                      <div className="mb-4">
                        <p className="text-gray-300 leading-relaxed">{note.note}</p>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleTimestampClick(note)}
                          className="px-3 py-1 bg-purple-500 text-white text-xs rounded-full hover:bg-purple-600 transition-colors duration-200"
                        >
                          {note.timestamp}
                        </button>
                        
                        <Link
                          to={`/notes/${note.videoId}`}
                          className="text-purple-400 hover:text-purple-300 text-sm transition-colors duration-200"
                        >
                          View Video →
                        </Link>
                      </div>
                    </div>
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
