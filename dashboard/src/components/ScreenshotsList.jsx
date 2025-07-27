import React, { useState, useEffect } from "react";
import { Camera, Trash2, Clock, SortAsc, SortDesc } from "lucide-react";
import axios from "axios";

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ScreenshotsList({ video, onScreenshotDelete }) {
  const [screenshots, setScreenshots] = useState([]);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScreenshots();
  }, [video.videoId]);

  const fetchScreenshots = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/bookmark/${video.videoId}/screenshots`);
      if (response.data.success) {
        setScreenshots(response.data.screenshots);
      }
    } catch (error) {
      console.error('Error fetching screenshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScreenshot = async (idx) => {
    try {
      const response = await axios.delete(`http://localhost:5000/bookmark/${video.videoId}/screenshots/${idx}`);
      if (response.data.success) {
        setScreenshots(response.data.video.screenshots);
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

  if (loading) {
    return (
      <div className="w-full pb-16">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSort('timestamp')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'timestamp'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Time
            {sortBy === 'timestamp' && (
              sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleSort('createdAt')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'createdAt'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Date
            {sortBy === 'createdAt' && (
              sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Screenshots Grid */}
      {screenshots.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            No screenshots yet. Take screenshots while adding notes!
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
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NzM4MyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => handleDeleteScreenshot(idx)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-block bg-blue-600 text-white font-mono px-3 py-1 rounded-lg text-sm">
                    {formatTimestamp(screenshot.timestamp)}
                  </span>
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
    </div>
  );
} 