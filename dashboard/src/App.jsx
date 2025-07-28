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
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading your bookmarks...</p>
        </div>
      </div>
    );
    
  if (error)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-purple-500 text-6xl mb-4">⚠️</div>
          <div className="text-white text-xl mb-2">Oops! Something went wrong</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 gradient-text animate-fade-in">
            YouTube Notes
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
            Organize and manage your YouTube bookmarks with smart notes and favorites
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="youtube-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">{filteredVideos.length}</div>
            <div className="text-gray-400">Total Videos</div>
          </div>
          <div className="youtube-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {filteredVideos.filter(v => v.favorite).length}
            </div>
            <div className="text-gray-400">Favorites</div>
          </div>
          <div className="youtube-card p-6 text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {filteredVideos.reduce((total, v) => total + (v.notes?.length || 0), 0)}
            </div>
            <div className="text-gray-400">Total Notes</div>
          </div>
        </div>

        {/* Videos Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-semibold text-white mb-2">No videos found</h3>
            <p className="text-gray-400">
              {search ? 'Try adjusting your search terms' : 'Start bookmarking videos to see them here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {filteredVideos.map((video, index) => (
              <div key={video._id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <BookmarkCard video={video} onFavoriteToggle={onFavoriteToggle} />
              </div>
            ))}
          </div>
        )}
      </div>
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
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-24">
        <Header 
          search={search} 
          setSearch={setSearch} 
          sortBy={sortBy} 
          setSortBy={setSortBy} 
          sortOrder={sortOrder} 
          setSortOrder={setSortOrder} 
          currentPage={getCurrentPage()} 
        />
        <main className="flex-1 overflow-y-auto">
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
        </main>
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
