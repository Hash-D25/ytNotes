import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const GoogleDrivePage = () => {
  const { isAuthenticated, logout, authAxios } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  // Fetch files from Google Drive
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await authAxios.get('/drive/files');
      setFiles(response.data.files);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch files:', err);
      setError('Failed to fetch files from Google Drive');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Upload file to Google Drive
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result.split(',')[1]; // Remove data URL prefix

                 const response = await authAxios.post('/upload-to-drive', {
           fileName: selectedFile.name,
           fileData: base64Data
         });

        // Refresh file list
        await fetchFiles();
        setSelectedFile(null);
        
        // Clear file input
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload file to Google Drive');
    } finally {
      setUploading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen dark:bg-gray-900 bg-gray-50 flex items-center justify-center">
        <div className="youtube-card p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">☁️</div>
                      <h2 className="text-2xl font-bold dark:text-white text-gray-900 mb-4">Google Drive Integration</h2>
          <p className="text-gray-400 mb-6">
            Connect your Google Drive to upload and manage your files
          </p>
                     <a
             href="http://localhost:5000/auth/google"
             className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 inline-flex items-center"
           >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 bg-gray-50 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold dark:text-white text-gray-900 mb-2">Google Drive</h1>
            <p className="text-gray-400">Upload and manage your files in Google Drive</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 bg-green-900 border border-green-700 text-green-200 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Connected</span>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Connection Info */}
        <div className="youtube-card p-6 mb-8">
                      <h3 className="text-xl font-semibold dark:text-white text-gray-900 mb-4">Connection Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                              <h4 className="text-lg font-medium dark:text-white text-gray-900 mb-2">📁 Folder Structure</h4>
              <div className="text-gray-300 text-sm space-y-1">
                <div>• ytNotes/</div>
                <div className="ml-4">• screenshots/</div>
                <div className="ml-8">• {`{videoId}_{timestamp}.png`}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="youtube-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold dark:text-white text-gray-900">Your Files</h3>
            <button
              onClick={fetchFiles}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📁</div>
              <p className="text-gray-400">No files found in your Google Drive</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div key={file.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="dark:text-white text-gray-900 font-medium truncate">{file.name}</div>
                    <div className="text-gray-400 text-sm">
                      {file.mimeType?.startsWith('image/') ? '🖼️' : '📄'}
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm mb-3">
                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                  </div>
                  <div className="text-gray-500 text-xs mb-3">
                    {new Date(file.createdTime).toLocaleDateString()}
                  </div>
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm underline"
                  >
                    View in Drive
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleDrivePage; 