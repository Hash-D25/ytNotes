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
