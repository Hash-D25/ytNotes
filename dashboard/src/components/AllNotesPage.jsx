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