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
