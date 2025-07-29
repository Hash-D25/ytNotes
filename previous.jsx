//AllNotesPage.jsx
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import NoteCard from './NoteCard';

export default function AllNotesPage({ videos, search, setSearch, sortBy, setSortBy, sortOrder, setSortOrder }) {
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const navigate = useNavigate();

  const toggleNoteExpansion = (idx) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) newSet.delete(idx); else newSet.add(idx);
      return newSet;
    });
  };

  const handleTimestampClick = (note) => {
    // Navigate to NotesList page with timestamp parameter
    navigate(`/notes/${note.videoId}?t=${note.timestamp}`);
  };

  const handleYouTubeClick = (note) => {
    const url = `https://www.youtube.com/watch?v=${note.videoId}&t=${note.timestamp}`;
    window.open(url, '_blank');
  };

  // Flatten all notes with video info
  const allNotes = useMemo(() => {
    return videos.flatMap(video => 
      video.notes.map(note => ({
        ...note,
        videoId: video.videoId,
        videoTitle: video.videoTitle,
        videoCreatedAt: video.createdAt
      }))
    );
  }, [videos]);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = allNotes.filter(note => 
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
  }, [allNotes, search, sortBy, sortOrder]);

  function formatTimestamp(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  return (
    <div className="pt-24">
      <div className="max-w-6xl mx-auto px-2 md:px-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">All Notes</h2>
        <div className="text-gray-600">Total Notes: {allNotes.length}</div>
      </div>

      {/* Search and Sort - Now handled by global header */}
      <div className="mb-6">
        <div className="text-gray-600 text-sm">
          Showing {filteredNotes.length} of {allNotes.length} notes
          {search && ` matching "${search}"`}
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            {search ? 'No notes found matching your search.' : 'No notes available.'}
          </div>
        ) : (
          filteredNotes.map((note, idx) => (
            <NoteCard
              key={idx}
              note={note.note}
              timestamp={formatTimestamp(note.timestamp)}
              videoTitle={note.videoTitle}
              createdAt={new Date(note.createdAt).toLocaleDateString()}
              expanded={expandedNotes.has(idx)}
              onToggleExpand={() => toggleNoteExpansion(idx)}
              onTimestampClick={() => handleTimestampClick(note)}
              onYouTubeClick={() => handleYouTubeClick(note)}
            >
              <Link 
                to={`/notes/${note.videoId}`}
                className="ml-4 flex justify-end text-blue-500 hover:text-blue-700 text-sm font-medium"
              >
                Go to Video
              </Link>
            </NoteCard>
          ))
        )}
      </div>
      </div>
    </div>
  );
} 

//BookmarkCard.jsx
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

//FavoritesPage.jsx
import React, { useState } from "react";
import { HeartIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Pencil, Trash2, Check, X
} from "lucide-react";
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
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Favorites</h1>

          {/* Tab Buttons */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab("videos")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === "videos"
                  ? "bg-red-400 text-white shadow-md" // active style with visible background and white text
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Favorite Videos ({favoriteVideos?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab("notes")}
              className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === "notes"
                  ? "bg-red-400 text-white shadow-md" // Active tab: visible blue background and white text
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300" // Inactive tab
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
              <div className="mb-4 text-gray-600 text-sm">
                Showing {favoriteVideos.length} favorite videos matching "{search}"
              </div>
            )}
            {favoriteVideos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
                <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No favorite videos yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favoriteVideos.map((video) => (
                  <div
                    key={video.videoId}
                    className="group bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ease-out relative overflow-hidden"
                  >
                    {/* Heart Icon */}
                    <button className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:scale-110 transition-all duration-200">
                      <HeartIcon className="w-5 h-5 text-red-500" />
                    </button>

                    {/* Thumbnail */}
                    <div className="relative overflow-hidden">
                      <img
                        src={`https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`}
                        alt={video.videoTitle}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {video.videoTitle}
                      </h3>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <span>{video.notes.length} notes</span>
                        <span>
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
                ))}
              </div>
            )}
          </div>
        ) : (
          // Favorite Notes Tab
          <div className="pb-8 pr-16">
            {search && (
              <div className="mb-4 text-gray-600 text-sm">
                Showing {allFavoriteNotes.length} favorite notes matching "{search}"
              </div>
            )}
            {allFavoriteNotes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
                <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No favorite notes yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allFavoriteNotes.map((note, idx) => (
                  <div key={`${note.videoId}-${idx}`}>
                    {editingIdx === idx ? (
                      // Edit Mode
                      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block bg-blue-600 text-white font-mono px-3 py-1 rounded-lg text-sm">
                            {`${Math.floor(note.timestamp / 60)
                              .toString()
                              .padStart(2, "0")}:${(note.timestamp % 60)
                              .toString()
                              .padStart(2, "0")}`}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-primary font-medium">
                            {note.videoTitle}
                          </span>
                        </div>
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                          rows="4"
                        />
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={() => handleEditNote(idx, editNote)}
                            className="p-2 text-green-500 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setEditingIdx(null)}
                            className="p-2 text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <NoteCard
                        note={note.note}
                        timestamp={`${Math.floor(note.timestamp / 60)
                          .toString()
                          .padStart(2, "0")}:${(note.timestamp % 60)
                          .toString()
                          .padStart(2, "0")}`}
                        videoTitle={note.videoTitle}
                        expanded={expandedNotes.has(idx)}
                        onToggleExpand={() => toggleNoteExpansion(idx)}
                        onTimestampClick={() => handleTimestampClick(note)}
                        onYouTubeClick={() => handleYouTubeClick(note)}
                      >
                        <div className="flex items-center gap-2 flex-shrink-0 mt-4 justify-end">
                          <button
                            onClick={() => handleLikeToggle(idx, note.liked)}
                            className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <HeartIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingIdx(idx);
                              setEditNote(note.note);
                            }}
                            className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(idx)}
                            className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </NoteCard>
                    )}
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

//Header.jsx
import React, { useRef, useEffect, useState } from 'react';
import { MagnifyingGlassIcon, UserIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

export default function Header({ search, setSearch, sortBy, setSortBy, sortOrder, setSortOrder, currentPage = 'home' }) {
  const searchInputRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getSortOptions = () => {
    switch (currentPage) {
      case 'home':
      case 'favorites':
        return [
          { value: 'createdAt', label: 'Newest' },
          { value: 'title', label: 'Title' },
          { value: 'favorite', label: 'Favorites' }
        ];
      case 'notes':
        return [
          { value: 'createdAt', label: 'Newest' },
          { value: 'timestamp', label: 'By Timestamp' },
          { value: 'title', label: 'By Video Title' }
        ];
      case 'video':
        return [
          { value: 'createdAt', label: 'Newest' },
          { value: 'timestamp', label: 'By Timestamp' }
        ];
      default:
        return [];
    }
  };

  const handleOptionSelect = (value) => {
    setSortBy(value);
    setIsDropdownOpen(false);
  };

  const currentSortLabel = getSortOptions().find(opt => opt.value === sortBy)?.label || 'Sort By';

  return (
    <nav className="top-0 left-16 w-[calc(100%-4rem)] z-40 flex items-center justify-between px-8 py-3 rounded-b-2xl  backdrop-blur-sm">
      <div className="flex items-center gap-2 text-primary font-bold text-xl">
        <span className="font-extrabold tracking-tight">Dashboard</span>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-xl flex items-center">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search videos... (Press / to focus)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-5 pr-12 py-2 rounded-full border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base transition-all duration-200"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary transition-colors">
            <MagnifyingGlassIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 ml-4" ref={dropdownRef}>
          {/* Custom Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between px-4 py-2 pr-10 rounded-full border border-gray-300 bg-white text-gray-800 font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer transition-all duration-200 hover:border-gray-400 min-w-[100px]"
              style={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              {currentSortLabel}
              <svg
                className={`ml-2 w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-lg bg-white shadow-lg py-1 border border-gray-200 max-h-60 overflow-auto">
                {getSortOptions().map((option) => (
                  <div
                    key={option.value}
                    className={`px-4 py-2 cursor-pointer transition-colors duration-150 ${
                      sortBy === option.value 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => handleOptionSelect(option.value)}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowsUpDownIcon className={`w-5 h-5 ${sortOrder === 'asc' ? 'text-gray-600' : 'text-gray-600 transform rotate-180'}`} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-6 mr-0">
        <div className="rounded-full border border-gray-200 shadow-sm p-1 bg-white hover:bg-gray-50 transition-colors duration-200">
          <img src="profileIcons/pink.png" alt="User profile" className="w-7 h-7" />
        </div>
      </div>
    </nav>
  );
}

//NoteCard.jsx
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
              <>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">
                  {new Date(createdAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        )}

        <div className="mb-4">
          {expanded ? (
            <p className="text-gray-800 text-sm leading-relaxed break-words whitespace-pre-line min-w-0">{note}</p>
          ) : (
            <div className={`${collapsedHeight} overflow-hidden`}>
              <p className="text-gray-800 text-sm leading-relaxed break-words whitespace-pre-line min-w-0">{note}</p>
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
            className="text-primary hover:text-primary-dark text-sm font-medium mt-2"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </>
  );
} 

//NotesList.jsx
import React, { useState } from "react";
import {
  Sparkles,
  Pencil,
  Trash2,
  Check,
  X,
  HeartIcon as HeartOutline,
  HeartIcon as HeartSolid,
  Camera,
} from "lucide-react";
import { ArrowTopRightOnSquareIcon 
} from "@heroicons/react/24/outline";
import axios from "axios";
import NoteCard from './NoteCard';
import ScreenshotsList from './ScreenshotsList';

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Convert h:mm:ss format to seconds
function parseTimestamp(timestampString) {
  const parts = timestampString.split(':');
  if (parts.length === 2) {
    // mm:ss format
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // h:mm:ss format
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

// Convert seconds to h:mm:ss format
function formatTimestampInput(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

export default function NotesList({
  video,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onLikeToggle,
  search,
  setSearch,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onTimestampClick,
  onYouTubeClick,
}) {
  const [newNote, setNewNote] = useState("");
  const [newTimestamp, setNewTimestamp] = useState("");
  const [editingIdx, setEditingIdx] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [activeTab, setActiveTab] = useState('notes');

  const toggleNoteExpansion = (idx) => {
    setExpandedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const handleEditNote = async (idx, newNote) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/bookmark/${video.videoId}/${idx}`,
        {
          note: newNote,
        }
      );
      if (response.data.success) {
        onEditNote(idx, newNote);
        setEditingIdx(null);
      }
    } catch (err) {
      alert("Failed to edit note");
    }
  };

  const handleDeleteNote = async (idx) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/bookmark/${video.videoId}/${idx}`
      );
      if (response.data.success) {
        onDeleteNote(idx);
      }
    } catch (err) {
      alert("Failed to delete note");
    }
  };

  const handleLikeToggle = async (idx, liked) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/bookmark/${video.videoId}/${idx}/like`,
        {
          liked: !liked,
        }
      );
      if (response.data.success) {
        onLikeToggle(idx, !liked);
      }
    } catch (err) {
      alert("Failed to toggle like");
    }
  };

  const handleTimestampClick = (timestamp) => {
    if (onTimestampClick) {
      onTimestampClick(timestamp);
    }
  };

  const handleYouTubeClick = (timestamp) => {
    if (onYouTubeClick) {
      onYouTubeClick(timestamp);
    }
  };

  const handleAddNote = () => {
    if (newNote && newTimestamp) {
      const seconds = parseTimestamp(newTimestamp);
      if (seconds >= 0) {
        onAddNote(seconds, newNote);
        setNewNote("");
        setNewTimestamp("");
      } else {
        alert("Please enter a valid timestamp in format: mm:ss or h:mm:ss");
      }
    }
  };

  const handleScreenshotDelete = (idx) => {
    // This will be handled by the ScreenshotsList component
  };

  return (
    <div className="w-full pb-16">
      {/* Header with Tabs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            {activeTab === 'notes' ? `Notes (${video.notes.length})` : 'Screenshots'}
          </h3>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('screenshots')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'screenshots'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            Screenshots
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'notes' ? (
        <>
          {/* Add Note Form */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Note
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Timestamp (mm:ss or h:mm:ss)"
                  value={newTimestamp}
                  onChange={(e) => setNewTimestamp(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Format: mm:ss or h:mm:ss</p>
              </div>
              <input
                type="text"
                placeholder="Add a new note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50 md:col-span-2"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="px-6 py-3 bg-red-400 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
                onClick={handleAddNote}
              >
                Add Note
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            {video.notes.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  No notes yet. Add your first note above!
                </p>
              </div>
            ) : (
              video.notes
                .filter(note => 
                  note.note.toLowerCase().includes(search.toLowerCase()) ||
                  video.videoTitle.toLowerCase().includes(search.toLowerCase())
                )
                .sort((a, b) => {
                  const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
                  switch (sortBy) {
                    case 'timestamp':
                      return (a.timestamp - b.timestamp) * sortMultiplier;
                    case 'createdAt':
                    default:
                      return (new Date(b.createdAt) - new Date(a.createdAt)) * sortMultiplier;
                  }
                })
                .map((note, idx) => (
                <div key={idx}>
                  {editingIdx === idx ? (
                    // Edit Mode
                    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block bg-blue-600 text-white font-mono px-3 py-1 rounded-lg text-sm">
                          {formatTimestamp(note.timestamp) || "00:00"}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-primary font-medium">{video.videoTitle}</span>
                        <span className="text-xs text-gray-500 ml-2">{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        rows="4"
                      />
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => handleEditNote(idx, editNote)}
                          className="p-2 text-green-500 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setEditingIdx(null)}
                          className="p-2 text-gray-500 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <NoteCard
                      note={note.note}
                      timestamp={formatTimestamp(note.timestamp) || "00:00"}
                      videoTitle={video.videoTitle}
                      createdAt={new Date(note.createdAt).toLocaleDateString()}
                      expanded={expandedNotes.has(idx)}
                      onToggleExpand={() => toggleNoteExpansion(idx)}
                      onTimestampClick={() => handleTimestampClick(note.timestamp)}
                      onYouTubeClick={() => handleYouTubeClick(note.timestamp)}
                      screenshot={(() => {
                        const screenshotData = note.screenshotPath ? {
                          path: note.screenshotPath,
                          timestamp: note.timestamp,
                          createdAt: note.createdAt
                        } : null;
                        console.log(`Note ${idx} screenshot data:`, screenshotData);
                        return screenshotData;
                      })()}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0 mt-4 justify-end">
                        <button
                          onClick={() => handleLikeToggle(idx, note.liked)}
                          className={`p-2 rounded-lg transition-colors ${
                            note.liked
                              ? "text-red-500 bg-red-50 hover:bg-red-100"
                              : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          {note.liked ? (
                            <HeartSolid className="w-5 h-5" />
                          ) : (
                            <HeartOutline className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingIdx(idx);
                            setEditNote(note.note);
                          }}
                          className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(idx)}
                          className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </NoteCard>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div>
          {(() => {
            try {
              return (
                <ScreenshotsList 
                  video={video} 
                  onScreenshotDelete={handleScreenshotDelete}
                  onTimestampClick={handleTimestampClick}
                  onYouTubeClick={handleYouTubeClick}
                />
              );
            } catch (error) {
              console.error('Error rendering ScreenshotsList:', error);
              return (
                <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    Error loading screenshots. Please try refreshing the page.
                  </p>
                </div>
              );
            }
          })()}
        </div>
      )}
    </div>
  );
}

//NotesPage.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowTopRightOnSquareIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import NotesList from './NotesList';
import axios from 'axios';

export default function NotesPage({ videos, fetchVideos, search, setSearch, sortBy, setSortBy, sortOrder, setSortOrder }) {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // All hooks must be called at the top level, before any conditional returns
  const [localNotes, setLocalNotes] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const iframeRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [apiReady, setApiReady] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Get timestamp from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const timestampParam = urlParams.get('t');

  // Find video - moved after hooks
  const video = videos.find(v => v.videoId === videoId);

  // Initialize localNotes when video changes
  useEffect(() => {
    if (video) {
      setLocalNotes(video.notes || []);
    }
  }, [video]);

  // Check if focus is in an input field
  const isInputFocused = () => {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
  };

  // Keyboard shortcuts handler - use useCallback to prevent recreation
  const handleKeyDown = useCallback((event) => {
    // Don't handle shortcuts if focus is in input field (except for specific shortcuts)
    if (isInputFocused() && !['m', 'c', '?', 'Escape'].includes(event.key)) {
      return;
    }

    if (!apiReady || !player) return;

    // Prevent default behavior for these keys
    const preventDefaultKeys = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'f', 'm', 'c', '<', '>'];
    if (preventDefaultKeys.includes(event.key)) {
      event.preventDefault();
    }

    switch (event.key) {
      case ' ': // Space - Play/Pause
        if (isInputFocused()) return; // Don't handle space in input fields
        if (player.getPlayerState() === 1) { // Playing
          player.pauseVideo();
        } else {
          player.playVideo();
        }
        break;
      
      case 'ArrowLeft': // Left arrow - Rewind 10 seconds
        if (isInputFocused()) return;
        const currentTime = player.getCurrentTime();
        player.seekTo(Math.max(0, currentTime - 10), true);
        break;
      
      case 'ArrowRight': // Right arrow - Forward 10 seconds
        if (isInputFocused()) return;
        const currentTimeForward = player.getCurrentTime();
        player.seekTo(currentTimeForward + 10, true);
        break;
      
      case 'ArrowUp': // Up arrow - Volume up
        const currentVolume = player.getVolume();
        player.setVolume(Math.min(100, currentVolume + 10));
        break;
      
      case 'ArrowDown': // Down arrow - Volume down
        const currentVolumeDown = player.getVolume();
        player.setVolume(Math.max(0, currentVolumeDown - 10));
        break;
      
      case 'f': // F key - Toggle fullscreen
        if (player.getPlayerState() !== -1) { // Not unstarted
          const iframe = iframeRef.current;
          if (iframe) {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              iframe.requestFullscreen();
            }
          }
        }
        break;
      
      case 'm': // M key - Toggle mute
        if (player.isMuted()) {
          player.unMute();
        } else {
          player.mute();
        }
        break;

      case 'c': // C key - Toggle captions
        try {
          const currentCaptions = player.getOption('captions', 'track');
          if (currentCaptions && currentCaptions.length > 0) {
            player.unloadModule('captions');
          } else {
            player.loadModule('captions');
            player.setOption('captions', 'track', {});
          }
        } catch (error) {
          console.log('Captions not available for this video');
        }
        break;



      case '<': // Shift + < - Decrease playback speed
        if (event.shiftKey) {
          const currentRate = player.getPlaybackRate();
          const newRate = Math.max(0.25, currentRate - 0.25);
          player.setPlaybackRate(newRate);
          setPlaybackRate(newRate);
        }
        break;

      case '>': // Shift + > - Increase playback speed
        if (event.shiftKey) {
          const currentRate = player.getPlaybackRate();
          const newRate = Math.min(2, currentRate + 0.25);
          player.setPlaybackRate(newRate);
          setPlaybackRate(newRate);
        }
        break;
      
      case '0': // 0 key - Jump to 0%
        if (isInputFocused()) return;
        player.seekTo(0, true);
        break;
      
      case '1': // 1 key - Jump to 10%
        if (isInputFocused()) return;
        const duration = player.getDuration();
        player.seekTo(duration * 0.1, true);
        break;
      
      case '2': // 2 key - Jump to 20%
        if (isInputFocused()) return;
        const duration2 = player.getDuration();
        player.seekTo(duration2 * 0.2, true);
        break;
      
      case '3': // 3 key - Jump to 30%
        if (isInputFocused()) return;
        const duration3 = player.getDuration();
        player.seekTo(duration3 * 0.3, true);
        break;
      
      case '4': // 4 key - Jump to 40%
        if (isInputFocused()) return;
        const duration4 = player.getDuration();
        player.seekTo(duration4 * 0.4, true);
        break;
      
      case '5': // 5 key - Jump to 50%
        if (isInputFocused()) return;
        const duration5 = player.getDuration();
        player.seekTo(duration5 * 0.5, true);
        break;
      
      case '6': // 6 key - Jump to 60%
        if (isInputFocused()) return;
        const duration6 = player.getDuration();
        player.seekTo(duration6 * 0.6, true);
        break;
      
      case '7': // 7 key - Jump to 70%
        if (isInputFocused()) return;
        const duration7 = player.getDuration();
        player.seekTo(duration7 * 0.7, true);
        break;
      
      case '8': // 8 key - Jump to 80%
        if (isInputFocused()) return;
        const duration8 = player.getDuration();
        player.seekTo(duration8 * 0.8, true);
        break;
      
      case '9': // 9 key - Jump to 90%
        if (isInputFocused()) return;
        const duration9 = player.getDuration();
        player.seekTo(duration9 * 0.9, true);
        break;
      
      case '?': // Question mark - Show shortcuts help
        setShowShortcuts(!showShortcuts);
        break;
      
      case 'Escape': // Escape - Hide shortcuts help
        setShowShortcuts(false);
        break;
      
      default:
        break;
    }
  }, [apiReady, player, showShortcuts]);



  // Load YouTube iframe API
  useEffect(() => {
    if (!video) return; // Early return if no video

    let scriptLoaded = false;

    // Load YouTube iframe API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      scriptLoaded = true;
    }

    // Initialize player when API is ready
    const initializePlayer = () => {
      if (window.YT && window.YT.Player && iframeRef.current) {
        try {
          const newPlayer = new window.YT.Player(iframeRef.current, {
          height: '100%',
          width: '100%',
          videoId: video.videoId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              setPlayer(event.target);
              setApiReady(true);
              // Auto-seek to timestamp if present
              if (timestampParam) {
                const timestamp = parseInt(timestampParam);
                if (!isNaN(timestamp)) {
                  setTimeout(() => {
                    event.target.seekTo(timestamp, true);
                    event.target.playVideo();
                  }, 1000);
                }
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
              // Fallback to iframe method
              setApiReady(false);
              // Try to load the video using a simple iframe as fallback
              if (iframeRef.current && video) {
                const fallbackUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`;
                iframeRef.current.src = fallbackUrl;
              }
            },
          },
        });
        } catch (error) {
          console.error('Error initializing YouTube player:', error);
          // Fallback to simple iframe
          if (iframeRef.current && video) {
            const fallbackUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`;
            iframeRef.current.src = fallbackUrl;
          }
        }
      }
    };

    // Set up the API ready callback
    window.onYouTubeIframeAPIReady = initializePlayer;

    // If API is already loaded, initialize immediately
    if (window.YT && window.YT.Player) {
      initializePlayer();
    }

    // Add a timeout to ensure player loads
    const timeoutId = setTimeout(() => {
      if (!apiReady && iframeRef.current && video) {
        console.log('YouTube API timeout, using fallback iframe');
        const fallbackUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`;
        iframeRef.current.src = fallbackUrl;
      }
    }, 5000); // 5 second timeout

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
      if (player) {
        try {
          player.destroy();
        } catch (error) {
          console.error('Error destroying player:', error);
        }
      }
    };
  }, [video, timestampParam, handleKeyDown, player]);

  // Function to seek to timestamp in the video
  const seekToTimestamp = useCallback((timestamp) => {
    if (apiReady && player && player.seekTo) {
      try {
        player.seekTo(timestamp, true);
        player.playVideo();
      } catch (error) {
        console.error('Error seeking with API:', error);
        // Fallback to iframe method
        seekToTimestampFallback(timestamp);
      }
    } else {
      // Fallback to iframe src method
      seekToTimestampFallback(timestamp);
    }
  }, [apiReady, player]);

  // Fallback method using iframe src
  const seekToTimestampFallback = useCallback((timestamp) => {
    if (iframeRef.current && video) {
      const iframe = iframeRef.current;
      const url = `https://www.youtube.com/embed/${video.videoId}?start=${timestamp}&autoplay=1`;
      iframe.src = url;
    }
  }, [video]);

  // Function to open YouTube at specific timestamp
  const openYouTubeAtTimestamp = useCallback((timestamp) => {
    if (video) {
      const url = `https://www.youtube.com/watch?v=${video.videoId}&t=${timestamp}`;
      window.open(url, '_blank');
    }
  }, [video]);

  const handleAddNote = useCallback(async (timestamp, note) => {
    if (!video) return;
    
    try {
      const res = await axios.post('http://localhost:5000/bookmark', {
        videoId: video.videoId,
        videoTitle: video.videoTitle,
        timestamp,
        note,
      });
      setLocalNotes(res.data.video.notes);
      await fetchVideos(); // Refresh global videos state
    } catch (err) {
      alert('Failed to add note');
    }
  }, [video, fetchVideos]);

  const handleEditNote = useCallback(async (idx, newNote) => {
    try {
      const updated = [...localNotes];
      updated[idx].note = newNote;
      setLocalNotes(updated);
      await fetchVideos(); // Refresh global videos state
    } catch (err) {
      alert('Failed to edit note');
    }
  }, [localNotes, fetchVideos]);

  const handleDeleteNote = useCallback(async (idx) => {
    try {
      const updated = [...localNotes];
      updated.splice(idx, 1);
      setLocalNotes(updated);
      await fetchVideos(); // Refresh global videos state
    } catch (err) {
      alert('Failed to toggle like');
    }
  }, [localNotes, fetchVideos]);

  const handleLikeToggle = useCallback(async (idx, liked) => {
    try {
      const updated = [...localNotes];
      updated[idx].liked = liked;
      setLocalNotes(updated);
      await fetchVideos(); // Refresh global videos state
    } catch (err) {
      alert('Failed to toggle like');
    }
  }, [localNotes, fetchVideos]);

  // Early return after all hooks
  if (!video) {
    return <div className="flex flex-col items-center justify-center h-full w-full text-gray-700">Video not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-5">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Back Button - Top Left */}
        <button 
          onClick={() => navigate(-1)} 
          className="mb-8 btn btn-outline btn-primary rounded-full px-6 py-2 self-start"
        >
          ← Back
        </button>

        {/* Video Section */}
        <div className="mb-8">
          {/* Video Player with proper aspect ratio */}
          <div className="w-full max-w-4xl mx-auto mb-6">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
              <div
                ref={iframeRef}
                className="absolute top-0 left-0 w-full h-full rounded-xl shadow-lg"
              ></div>
            </div>
          </div>

          {/* Video Title and Shortcuts Help */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 max-w-4xl leading-tight">
              {video.videoTitle}
            </h1>
            <div className="flex items-center gap-4">
              {apiReady && (
                <span className="text-sm text-gray-500">
                  Speed: {playbackRate}x
                </span>
              )}
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Keyboard Shortcuts (Press ?)"
              >
                <QuestionMarkCircleIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Modal */}
        {showShortcuts && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Space</span>
                  <span>Play/Pause</span>
                </div>
                <div className="flex justify-between">
                  <span>← →</span>
                  <span>Seek ±10s</span>
                </div>
                <div className="flex justify-between">
                  <span>↑ ↓</span>
                  <span>Volume ±10%</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift + &lt; &gt;</span>
                  <span>Speed Control</span>
                </div>
                <div className="flex justify-between">
                  <span>F</span>
                  <span>Toggle Fullscreen</span>
                </div>
                <div className="flex justify-between">
                  <span>M</span>
                  <span>Toggle Mute</span>
                </div>
                <div className="flex justify-between">
                  <span>C</span>
                  <span>Toggle Captions</span>
                </div>

                <div className="flex justify-between">
                  <span>0-9</span>
                  <span>Jump to 0%-90%</span>
                </div>
                <div className="flex justify-between">
                  <span>?</span>
                  <span>Show/Hide Help</span>
                </div>
                <div className="flex justify-between">
                  <span>Esc</span>
                  <span>Hide Help</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="max-w-4xl mx-auto">
          <NotesList
            video={{ ...video, notes: localNotes }}
            onAddNote={handleAddNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onLikeToggle={handleLikeToggle}
            search={search}
            setSearch={setSearch}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            onTimestampClick={seekToTimestamp}
            onYouTubeClick={openYouTubeAtTimestamp}
          />
        </div>
      </div>
    </div>
  );
} 

//ScreenshotsList.jsx
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Check if video exists
  if (!video || !video.videoId) {
    return (
      <div className="w-full pb-16">
        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
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
        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            No screenshots found for this video.
          </p>
          <p className="text-sm text-gray-400 mt-2">
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
              className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <Play className="w-4 h-4" />
              Slideshow
            </button>
          )}
          
          {/* Sort Controls */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => handleSort('timestamp')}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
                sortBy === 'timestamp' 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 hover:text-gray-800'
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
                  : 'text-gray-600 hover:text-gray-800'
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
        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            No screenshots found for this video.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Take screenshots while adding notes to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedScreenshots.map((screenshot, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="relative">
                <img
                  src={`http://localhost:5000${screenshot.path}`}
                  alt={`Screenshot at ${formatTimestamp(screenshot.timestamp)}`}
                  className="w-full h-48 object-cover cursor-pointer"
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
                      className="inline-flex items-center gap-1 bg-blue-600 text-white font-mono px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
                      title="Play video at this timestamp"
                    >
                      <Play className="w-3 h-3" />
                      {formatTimestamp(screenshot.timestamp)}
                    </button>
                    <button
                      onClick={() => handleYouTubeClick(screenshot.timestamp)}
                      className="inline-flex items-center gap-1 p-1 text-red-500 hover:text-red-600 transition-colors hover:bg-red-50 rounded"
                      title="Open in YouTube at this timestamp"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(screenshot.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">{video.videoTitle}</p>
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
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((slideshowIndex + 1) / sortedScreenshots.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 

//Sidebar.jsx
import React from 'react';
import { BookOpenIcon, HomeIcon, HeartIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { name: 'Dashboard', icon: <HomeIcon className="w-6 h-6" />, href: '/' },
  { name: 'All Notes', icon: <BookOpenIcon className="w-6 h-6" />, href: '/notes' },
  { name: 'Favorites', icon: <HeartIcon className="w-6 h-6" />, href: '/favorites' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar fixed top-0 left-0 h-153 w-16 bg-white shadow-lg flex flex-col items-center py-6 z-50 rounded-r-3xl border-r border-gray-200 mt-2 ">
      <div className="mb-8">
        <div className="bg-primary rounded-4xl p-2 shadow-md">
          <img src="icon.png" alt="logo" className="w-9 h-9" />
        </div>
      </div>
      <nav className="flex flex-col gap-6 flex-1">
        {NAV_LINKS.map(link => (
          <Link key={link.name} to={link.href} className="group flex flex-col items-center text-gray-400 hover:text-primary transition-colors">
            <span className="sidebar-icon flex items-center justify-center w-10 h-10 rounded-xl group-hover:bg-primary/10">
              {link.icon}
            </span>
            <span className="text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium tracking-wide">{link.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

//App.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import BookmarkCard from "./components/BookmarkCard";
import NotesPage from "./components/NotesPage";
import FavoritesPage from "./components/FavoritesPage";
import AllNotesPage from "./components/AllNotesPage";

function Dashboard({ videos, search, setSearch, loading, error, sortBy, setSortBy, sortOrder, setSortOrder, onFavoriteToggle }) {
  let filteredVideos = videos.filter((v) => v.videoTitle.toLowerCase().includes(search.toLowerCase()));
  
  const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
  
  if (sortBy === "title") filteredVideos = filteredVideos.sort((a, b) => a.videoTitle.localeCompare(b.videoTitle) * sortMultiplier);
  else if (sortBy === "favorite") filteredVideos = filteredVideos.filter(v => v.favorite).sort((a, b) => (new Date(b.createdAt) - new Date(a.createdAt)) * sortMultiplier);
  else filteredVideos = filteredVideos.sort((a, b) => (new Date(b.createdAt) - new Date(a.createdAt)) * sortMultiplier);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-base-100">
        <span className="loading loading-ring loading-lg text-primary"></span>
      </div>
    );
  if (error)
    return <div className="text-red-500 text-center mt-20">{error}</div>;

  return (
    <div className="pt-24 max-w-7xl mx-auto px-2 md:px-8">
        <h1 className="text-3xl md:text-5xl font-extrabold text-center mb-8 text-black drop-shadow-glow animate-fade-in gradient-text">
          YouTube Bookmark Notes
        </h1>
        {filteredVideos.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            No videos bookmarked yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <BookmarkCard key={video._id} video={video} onFavoriteToggle={onFavoriteToggle} />
            ))}
          </div>
        )}
      </div>
  );
}

function AppContent() {
  const location = useLocation();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" or "desc"

  // Determine current page based on location
  const getCurrentPage = () => {
    if (location.pathname === '/') return 'home';
    if (location.pathname === '/favorites') return 'favorites';
    if (location.pathname === '/notes') return 'notes';
    if (location.pathname.startsWith('/notes/')) return 'video';
    return 'home';
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "ytNotesDark");
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/videos");
      setVideos(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch videos");
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleFavoriteToggle = async (videoId, favorite) => {
    try {
      await axios.patch(`http://localhost:5000/videos/${videoId}/favorite`, { favorite });
      setVideos((prev) => prev.map(v => v.videoId === videoId ? { ...v, favorite } : v));
    } catch (err) {
      alert("Failed to update favorite");
    }
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen text-base-content flex overflow-x-hidden overflow-y-auto bg-gray-50"
      style={{}}
    >
      <Sidebar />
      <div className="flex-1 ml-16">
                  <Header search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder} currentPage={getCurrentPage()} />
        <Routes>
          <Route
            path="/"
            element={
                              <Dashboard
                  videos={videos}
                  search={search}
                  setSearch={setSearch}
                  loading={loading}
                  error={error}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  onFavoriteToggle={handleFavoriteToggle}
                />
            }
          />
                      <Route path="/favorites" element={<FavoritesPage videos={videos} fetchVideos={fetchVideos} onFavoriteToggle={handleFavoriteToggle} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder} />} />
            <Route path="/notes" element={<AllNotesPage videos={videos} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder} />} />
            <Route path="/notes/:videoId" element={<NotesPage videos={videos} fetchVideos={fetchVideos} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder} />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

//index.css
@import "tailwindcss";
@tailwind base;
@tailwind components;
@tailwind utilities;
