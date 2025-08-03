import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import BookmarkCard from "./components/BookmarkCard";
import NotesPage from "./components/NotesPage";
import FavoritesPage from "./components/FavoritesPage";
import AllNotesPage from "./components/AllNotesPage";
import GoogleDrivePage from "./components/GoogleDrivePage";
import LoginPage from "./components/LoginPage";
import AuthCallback from "./components/AuthCallback";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

function Dashboard({ videos, search, setSearch, loading, error, sortBy, setSortBy, sortOrder, setSortOrder, onFavoriteToggle, onVideoDelete }) {
  let filteredVideos = videos.filter((v) => v.videoTitle.toLowerCase().includes(search.toLowerCase()));
  
  const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
  
  if (sortBy === "title") filteredVideos = filteredVideos.sort((a, b) => a.videoTitle.localeCompare(b.videoTitle) * sortMultiplier);
  else if (sortBy === "favorite") filteredVideos = filteredVideos.filter(v => v.favorite).sort((a, b) => (new Date(b.createdAt) - new Date(a.createdAt)) * sortMultiplier);
  else filteredVideos = filteredVideos.sort((a, b) => (new Date(b.createdAt) - new Date(a.createdAt)) * sortMultiplier);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900 bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="dark:text-gray-400 text-gray-600">Loading your bookmarks...</p>
        </div>
      </div>
    );
    
  if (error)
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900 bg-gray-50">
        <div className="text-center">
          <div className="text-purple-500 text-6xl mb-4">⚠️</div>
          <div className="dark:text-white text-gray-900 text-xl mb-2">Oops! Something went wrong</div>
          <div className="dark:text-gray-400 text-gray-600">{error}</div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50">
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 gradient-text animate-fade-in">
            YouTube Notes
          </h1>
          <p className="dark:text-gray-400 text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto">
            Organize and manage your YouTube bookmarks with smart notes and favorites
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="youtube-card p-6 text-center">
                      <div className="text-3xl font-bold dark:text-white text-gray-900 mb-2">{filteredVideos.length}</div>
          <div className="dark:text-gray-400 text-gray-600">Total Videos</div>
        </div>
        <div className="youtube-card p-6 text-center">
          <div className="text-3xl font-bold dark:text-white text-gray-900 mb-2">
            {filteredVideos.filter(v => v.favorite).length}
          </div>
          <div className="dark:text-gray-400 text-gray-600">Favorites</div>
        </div>
        <div className="youtube-card p-6 text-center">
          <div className="text-3xl font-bold dark:text-white text-gray-900 mb-2">
            {filteredVideos.reduce((total, v) => total + (v.notes?.length || 0), 0)}
          </div>
          <div className="dark:text-gray-400 text-gray-600">Total Notes</div>
          </div>
        </div>

        {/* Videos Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-20">
            <div className="dark:text-gray-400 text-gray-500 text-6xl mb-6">📚</div>
            <h3 className="text-2xl font-semibold dark:text-white text-gray-900 mb-2">No videos found</h3>
            <p className="dark:text-gray-400 text-gray-600">
              {search ? 'Try adjusting your search terms' : 'Start bookmarking videos to see them here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
            {filteredVideos.map((video, index) => (
              <div key={video._id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <BookmarkCard video={video} onFavoriteToggle={onFavoriteToggle} onVideoDelete={onVideoDelete} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, authLoading, authAxios } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const location = useLocation();

  // Add message listener for Chrome extension
  useEffect(() => {
    const handleMessage = (event) => {
      // Only handle messages from our extension
      if (event.source !== window) return;
      
      if (event.data && event.data.action === 'getTokens') {
        console.log('🔍 Dashboard: Extension requesting tokens');
        
        // Get tokens from localStorage
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (accessToken && refreshToken) {
          console.log('✅ Dashboard: Sending tokens to extension');
          event.source.postMessage({
            action: 'getTokens',
            accessToken: accessToken,
            refreshToken: refreshToken
          }, event.origin);
        } else {
          console.log('❌ Dashboard: No tokens found in localStorage');
          event.source.postMessage({
            action: 'getTokens',
            accessToken: null,
            refreshToken: null
          }, event.origin);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path === "/favorites") return "favorites";
    if (path === "/notes") return "notes";
    if (path === "/drive") return "drive";
    if (path.startsWith("/notes/")) return "video";
    return "home";
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAxios.get("/videos");
      setVideos(response.data);
    } catch (err) {
      console.error("Error fetching videos:", err);
      setError("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchVideos();
    } else {
      setVideos([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const handleFavoriteToggle = async (videoId, favorite) => {
    try {
      await authAxios.patch(`/videos/${videoId}/favorite`, { favorite });
      setVideos((prev) => prev.map(v => v.videoId === videoId ? { ...v, favorite } : v));
    } catch (err) {
      alert("Failed to update favorite");
    }
  };

  const handleVideoDelete = async (videoId) => {
    try {
      setVideos((prev) => prev.filter(v => v.videoId !== videoId));
    } catch (err) {
      console.error("Error updating videos after delete:", err);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900 bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="dark:text-gray-400 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show auth-callback route regardless of authentication status
  if (location.pathname === '/auth-callback') {
    return <AuthCallback />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen dark:bg-gray-900 bg-gray-50 overflow-hidden">
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
                  onVideoDelete={handleVideoDelete}
                />
              }
            />
            <Route path="/favorites" element={<FavoritesPage videos={videos} fetchVideos={fetchVideos} onFavoriteToggle={handleFavoriteToggle} onVideoDelete={handleVideoDelete} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder} />} />
            <Route path="/notes" element={<AllNotesPage videos={videos} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder} />} />
            <Route path="/notes/:videoId" element={<NotesPage videos={videos} fetchVideos={fetchVideos} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder} />} />
            <Route path="/drive" element={<GoogleDrivePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
