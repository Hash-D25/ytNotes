import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, ArrowsUpDownIcon, ClockIcon } from '@heroicons/react/24/outline';
import NoteCard from './NoteCard';

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
      video.notes.map((note, noteIndex) => ({
        ...note,
        videoId: video.videoId,
        videoTitle: video.videoTitle,
        videoCreatedAt: video.createdAt,
        noteIndex
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

  const totalVideos = videos.length;
  const totalNotes = videos.reduce((total, v) => total + (v.notes?.length || 0), 0);

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50">
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">
            All Notes
          </h1>
          <p className="text-gray-400 text-lg">
            Browse and search through all your notes
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="youtube-card p-6 text-center">
            <div className="text-3xl font-bold dark:text-white text-gray-900 mb-2">{totalNotes}</div>
            <div className="text-gray-400">Total Notes</div>
          </div>
          <div className="youtube-card p-6 text-center">
            <div className="text-3xl font-bold dark:text-white text-gray-900 mb-2">{totalVideos}</div>
            <div className="text-gray-400">Total Videos</div>
          </div>
          <div className="youtube-card p-6 text-center">
            <div className="text-3xl font-bold dark:text-white text-gray-900 mb-2">{allNotes.length}</div>
            <div className="text-gray-400">Filtered Notes</div>
          </div>
        </div>

        {/* Notes List */}
        <div className="pb-8">
          {search && (
            <div className="mb-6 text-gray-400 text-sm text-center">
              Showing {filteredNotes.length} notes matching "{search}"
            </div>
          )}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-6xl mb-6">📝</div>
              <h3 className="text-2xl font-semibold dark:text-white text-gray-900 mb-2">No notes found</h3>
              <p className="text-gray-400">
                {search ? 'Try adjusting your search terms' : 'Start adding notes to see them here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {filteredNotes.map((note, index) => (
                <div key={`${note.videoId}-${note.noteIndex}`} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
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
                      className=" flex justify-end youtube-button px-4 py-2 text-sm hover:bg-purple-500 hover:text-white transition-all duration-200"
                    >
                      Go to Video
                    </Link>
                  </NoteCard>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 