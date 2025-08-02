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
import { useAuth } from "../contexts/AuthContext";
import NoteCard from './NoteCard';
import ScreenshotsList from './ScreenshotsList';

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
  const { authAxios } = useAuth();
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
      console.log('🔧 Edit note - Using authenticated axios');
      const response = await authAxios.patch(
        `/bookmark/${video.videoId}/${idx}`,
        {
          note: newNote,
        }
      );
      if (response.data.success) {
        onEditNote(idx, newNote);
        setEditingIdx(null);
        console.log('✅ Edit note successful');
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
        `/bookmark/${video.videoId}/${idx}`
      );
      if (response.data.success) {
        onDeleteNote(idx);
        console.log('✅ Delete note successful');
      }
    } catch (err) {
      console.error('❌ Delete note failed:', err);
      alert(`Failed to delete note: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleLikeToggle = async (idx, liked) => {
    try {
      console.log('=== LIKE TOGGLE DEBUG ===');
      console.log('Video object:', video);
      console.log('Video ID:', video?.videoId);
      console.log('Note index:', idx);
      console.log('Current liked state:', liked);
      console.log('Note object:', video?.notes?.[idx]);
      console.log('========================');
      
      console.log('🔧 Like toggle - Using authenticated axios');
      const response = await authAxios.patch(
        `/bookmark/${video.videoId}/${idx}/like`,
        {
          liked: !liked,
        }
      );
      console.log('Like toggle response:', response.data);
      if (response.data.success) {
        onLikeToggle(idx, !liked);
        console.log('✅ Like toggle successful');
      } else {
        console.error('Like toggle failed - no success in response');
        alert("Failed to toggle like - server returned no success");
      }
    } catch (err) {
      console.error('Like toggle error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      alert(`Failed to toggle like: ${err.response?.data?.error || err.message}`);
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
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            {activeTab === 'notes' ? `Notes (${video.notes.length})` : 'Screenshots'}
          </h3>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('screenshots')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'screenshots'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
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
          <div className="youtube-card p-6 mb-8">
            <h4 className="text-lg font-semibold text-white mb-4">
              Add New Note
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Timestamp (mm:ss or h:mm:ss)"
                  value={newTimestamp}
                  onChange={(e) => setNewTimestamp(e.target.value)}
                  className="px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400 w-full"
                />
                <p className="text-xs text-gray-400 mt-1">Format: mm:ss or h:mm:ss</p>
              </div>
              <input
                type="text"
                placeholder="Add a new note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="px-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400 md:col-span-2"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md hover:shadow-lg"
                onClick={handleAddNote}
              >
                Add Note
              </button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            {video.notes.length === 0 ? (
              <div className="text-center py-12 youtube-card">
                <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
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
                    <div className="youtube-card p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block bg-purple-600 text-white font-mono px-3 py-1 rounded-lg text-sm">
                          {formatTimestamp(note.timestamp) || "00:00"}
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-purple-400 font-medium">{video.videoTitle}</span>
                        <span className="text-xs text-gray-400 ml-2">{new Date(note.createdAt).toLocaleDateString()}</span>
                      </div>
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="w-full p-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-gray-800 text-white"
                        rows="4"
                      />
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => handleEditNote(idx, editNote)}
                          className="p-2 text-green-400 bg-green-500/20 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setEditingIdx(null)}
                          className="p-2 text-gray-400 bg-gray-500/20 rounded-lg hover:bg-gray-500/30 transition-colors"
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
                      isVideoNotesPage={true}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0 mt-4 justify-end">
                        <button
                          onClick={() => handleLikeToggle(idx, note.liked)}
                          className={`p-2 rounded-lg transition-colors ${
                            note.liked
                              ? "text-red-500 bg-red-500/20 hover:bg-red-500/30"
                              : "text-gray-400 bg-gray-500/20 hover:bg-gray-500/30"
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
                          className="p-2 text-blue-400 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(idx)}
                          className="p-2 text-red-400 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-colors"
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
                <div className="text-center py-12 youtube-card">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
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
