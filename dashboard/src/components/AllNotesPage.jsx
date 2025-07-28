import React from "react";
import { Link } from "react-router-dom";
import { ClockIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default function AllNotesPage({ videos, search, setSearch, sortBy, setSortBy, sortOrder, setSortOrder }) {
  // Get all notes from all videos with their indices, search filter and sorting
  const allNotes = videos
    .flatMap((video) =>
      video.notes.map((note, noteIndex) => ({
        ...note,
        videoId: video.videoId,
        videoTitle: video.videoTitle,
        noteIndex,
      }))
    )
    .filter((note) => 
      note.note.toLowerCase().includes(search.toLowerCase()) ||
      note.videoTitle.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'title':
          return a.videoTitle.localeCompare(b.videoTitle) * sortMultiplier;
        case 'timestamp':
          return (a.timestamp - b.timestamp) * sortMultiplier;
        case 'createdAt':
        default:
          return (new Date(b.createdAt) - new Date(a.createdAt)) * sortMultiplier;
      }
    });

  const totalVideos = videos.length;
  const totalNotes = videos.reduce((total, v) => total + (v.notes?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-900">
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
            <div className="text-3xl font-bold text-white mb-2">{totalNotes}</div>
            <div className="text-gray-400">Total Notes</div>
          </div>
          <div className="youtube-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">{totalVideos}</div>
            <div className="text-gray-400">Total Videos</div>
          </div>
          <div className="youtube-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">{allNotes.length}</div>
            <div className="text-gray-400">Filtered Notes</div>
          </div>
        </div>

        {/* Notes List */}
        <div className="pb-8">
          {search && (
            <div className="mb-6 text-gray-400 text-sm text-center">
              Showing {allNotes.length} notes matching "{search}"
            </div>
          )}
          {allNotes.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-6xl mb-6">📝</div>
              <h3 className="text-2xl font-semibold text-white mb-2">No notes found</h3>
              <p className="text-gray-400">
                {search ? 'Try adjusting your search terms' : 'Start adding notes to see them here'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {allNotes.map((note, index) => (
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
                    </div>

                    {/* Note Content */}
                    <div className="mb-4">
                      <p className="text-gray-300 leading-relaxed">{note.note}</p>
                    </div>

                    {/* Timestamp and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{note.timestamp}</span>
                      </div>
                      
                      <Link
                        to={`/notes/${note.videoId}`}
                        className="youtube-button px-4 py-2 text-sm hover:bg-purple-500 hover:text-white transition-all duration-200"
                      >
                        Go to Video
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 