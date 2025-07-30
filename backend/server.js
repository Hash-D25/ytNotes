const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { google } = require('googleapis');

dotenv.config({path: './.env'});

const app = express();

// Import token store and auth middleware
const { setTokens, getTokens, clearTokens } = require('./utils/tokenStore');
const { getCurrentUser, requireAuth } = require('./middleware/auth');
const User = require('./models/User');

// More permissive CORS for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'https://www.youtube.com',
      'https://youtube.com',
      'https://www.youtube.com:443',
      'https://youtube.com:443'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🔍 Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));
app.use(express.json({ limit: '50mb' }));

// Handle preflight requests
app.options('*', cors());

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    httpOnly: false, // Allow JavaScript access for cross-origin
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // More permissive for cross-origin
  },
  name: 'ytnotes-session'
}));

// Google OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback'
);

// Serve static files from screenshots directory
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

// Proxy endpoint for Google Drive images
app.get('/proxy-image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    console.log('🔍 Proxying image from:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    console.log('🔍 Proxy response status:', response.status);
    console.log('🔍 Proxy response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    console.log('🔍 Proxy success - Content-Type:', contentType, 'Size:', buffer.byteLength);
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('❌ Proxy image error:', error);
    res.status(500).json({ error: 'Failed to proxy image', details: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  console.log('🔍 Health check from:', req.headers.origin);
  res.send('API is running');
});

// Google OAuth routes
app.get('/auth/google', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  
  res.redirect(authUrl);

});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  console.log('🔐 OAuth Callback - Code received:', code ? 'Yes' : 'No');
  console.log('🔐 Session ID before:', req.sessionID);
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('🔐 Tokens received:', tokens ? 'Yes' : 'No');
    console.log('🔐 Access token:', tokens.access_token ? 'Present' : 'Missing');
    
    req.session.tokens = tokens;
    setTokens(tokens); // Store tokens globally for cross-origin access
    
    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    // Find or create user
    let user = await User.findOne({ googleId: userInfo.data.id });
    
    if (!user) {
      // Create new user
      user = new User({
        googleId: userInfo.data.id,
        email: userInfo.data.email,
        name: userInfo.data.name,
        picture: userInfo.data.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token
      });
      await user.save();
      console.log('✅ New user created:', user.email);
    } else {
      // Update existing user's tokens and last login
      user.accessToken = tokens.access_token;
      user.refreshToken = tokens.refresh_token;
      user.lastLogin = new Date();
      await user.save();
      console.log('✅ Existing user logged in:', user.email);
    }
    
    // Store user ID in session
    req.session.userId = user._id;
    
    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.status(500).send('Session save failed');
      }
      
      console.log('🔐 Session saved successfully');
      console.log('🔐 Session ID after:', req.sessionID);
      console.log('🔐 Session tokens:', req.session.tokens ? 'Present' : 'Missing');
      console.log('🔐 Session userId:', req.session.userId);
      console.log('🔐 Global tokens stored:', getTokens() ? 'Yes' : 'No');
      
      res.redirect('http://localhost:5173'); // Redirect to your frontend
    });
  } catch (error) {
    console.error('❌ Error getting tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

// Check authentication status
app.get('/auth/status', async (req, res) => {
  console.log('🔍 Auth Status Check:');
  console.log('🔍 Session ID:', req.sessionID);
  console.log('🔍 Session tokens:', req.session.tokens ? 'Present' : 'Missing');
  console.log('🔍 Session keys:', Object.keys(req.session));
  
  // Check both session tokens and global tokens
  const hasSessionTokens = req.session.tokens;
  const hasGlobalTokens = getTokens();
  
  if (hasSessionTokens || hasGlobalTokens) {
    try {
      // Get current user info
      await getCurrentUser(req, res, () => {
        console.log('✅ User is authenticated:', req.currentUser.email);
        res.json({ 
          authenticated: true, 
          message: '✅ User is authenticated',
          user: {
            id: req.currentUser._id,
            email: req.currentUser.email,
            name: req.currentUser.name,
            picture: req.currentUser.picture
          }
        });
      });
    } catch (error) {
      console.error('❌ Error getting user info:', error);
      res.json({ authenticated: false, message: '❌ Authentication failed' });
    }
  } else {
    console.log('❌ User is not authenticated');
    res.json({ authenticated: false, message: '❌ User is not authenticated' });
  }
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({ error: '❌ Logout failed' });
    }
    // Clear global tokens on logout
    clearTokens();
    console.log('✅ User logged out successfully - Global tokens cleared');
    res.json({ message: '✅ Logged out successfully' });
  });
});

// Get user profile information
app.get('/auth/profile', async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({ error: '❌ Not authenticated' });
    }

    // Set OAuth credentials
    oauth2Client.setCredentials(req.session.tokens);
    
    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    res.json({
      name: userInfo.data.name,
      email: userInfo.data.email,
      picture: userInfo.data.picture,
      given_name: userInfo.data.given_name,
      family_name: userInfo.data.family_name
    });
  } catch (err) {
    console.error('❌ Failed to get user profile:', err);
    res.status(500).json({ error: '❌ Failed to get user profile' });
  }
});



// Check if Google Drive is available (for extension)
app.get('/auth/drive-available', (req, res) => {
  const hasTokens = getTokens() !== null;
  console.log('🔍 Drive availability check - Global tokens:', hasTokens ? 'Present' : 'Missing');
  res.json({ 
    available: hasTokens,
    message: hasTokens ? '✅ Google Drive available' : '❌ Google Drive not available'
  });
});

// Logout route
app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: '❌ Failed to logout' });
    }
    clearTokens(); // Clear global tokens on logout
    res.json({ message: '✅ Logged out successfully' });
  });
});

// Google Drive upload route
app.post('/upload-to-drive', async (req, res) => {
  try {
    // Check authentication
    if (!req.session.tokens) {
      return res.status(401).json({ error: '❌ Not authenticated' });
    }
    
    // Validate input
    const { fileName, fileData } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ error: '❌ Missing fileName or fileData' });
    }

    // Set OAuth credentials
  oauth2Client.setCredentials(req.session.tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Convert base64 to buffer
    let buffer;
    try {
      buffer = Buffer.from(fileData, 'base64');
    } catch (error) {
      return res.status(400).json({ error: '❌ Invalid base64 data' });
    }

    // Detect MIME type based on file extension
    const getMimeType = (filename) => {
      const ext = filename.toLowerCase().split('.').pop();
      const mimeTypes = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'txt': 'text/plain'
      };
      return mimeTypes[ext] || 'application/octet-stream';
    };

  const fileMetadata = { name: fileName };
  const media = {
      mimeType: getMimeType(fileName),
      body: buffer,
  };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, name, size',
    });

    res.json({ 
      message: '✅ Uploaded to Google Drive', 
      link: file.data.webViewLink,
      fileId: file.data.id,
      fileName: file.data.name,
      fileSize: file.data.size
    });
  } catch (err) {
    console.error('❌ Upload failed:', err);
    
    // Handle specific Google API errors
    if (err.code === 401) {
      return res.status(401).json({ error: '❌ Authentication expired. Please re-authenticate.' });
    }
    
    res.status(500).json({ error: '❌ Failed to upload to Google Drive' });
  }
});

// List files from Google Drive
app.get('/drive/files', async (req, res) => {
  try {
    // Check authentication
    if (!req.session.tokens) {
      return res.status(401).json({ error: '❌ Not authenticated' });
    }
    
    // Set OAuth credentials
    oauth2Client.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.list({
      pageSize: 20,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink)',
      orderBy: 'createdTime desc'
    });

    res.json({ 
      files: response.data.files,
      message: '✅ Files retrieved successfully'
    });
  } catch (err) {
    console.error('❌ Failed to list files:', err);
    
    if (err.code === 401) {
      return res.status(401).json({ error: '❌ Authentication expired. Please re-authenticate.' });
    }
    
    res.status(500).json({ error: '❌ Failed to retrieve files from Google Drive' });
  }
});

// Import models
const Video = require('./models/Video');

// Import Google Drive helpers
const { 
  getOrCreateYtNotesFolder, 
  getOrCreateScreenshotsFolder, 
  uploadScreenshotToDrive, 
  makeFilePublicAndGetUrl 
} = require('./utils/googleDriveHelpers');

// Screenshot upload endpoint with Google Drive integration
app.post('/upload-screenshot', async (req, res) => {
  try {
    // Check authentication
    if (!req.session.tokens) {
      return res.status(401).json({ error: '❌ Not authenticated' });
    }

    // Validate input
    const { imageData, videoId, timestamp } = req.body;
    if (!imageData || !videoId || !timestamp) {
      return res.status(400).json({ error: '❌ Missing required fields' });
    }

    // Find the video
    const video = await Video.findOne({ videoId });
    if (!video) {
      return res.status(404).json({ error: '❌ Video not found' });
    }

    // Set OAuth credentials for Drive
    oauth2Client.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Step 1: Create organized folder structure
    const ytNotesFolderId = await getOrCreateYtNotesFolder(drive);
    const screenshotsFolderId = await getOrCreateScreenshotsFolder(drive, ytNotesFolderId);

    // Step 2: Generate proper filename
    const timestampStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-');
    const fileName = `${videoId}_${timestampStr}.png`;

    // Step 3: Upload screenshot to organized folder
    const fileId = await uploadScreenshotToDrive(drive, screenshotsFolderId, imageData, fileName);

    // Step 4: Make file public and get shareable link
    const shareableLink = await makeFilePublicAndGetUrl(drive, fileId);

    // Step 5: Save to MongoDB
    video.screenshots.push({
      timestamp: timestamp,
      path: shareableLink, // Store Google Drive URL in path field
      createdAt: new Date()
    });

    await video.save();

    res.json({
      message: '✅ Screenshot uploaded successfully to organized Google Drive folder',
      screenshot: {
        timestamp: timestamp,
        path: shareableLink,
        fileName: fileName,
        folderStructure: 'ytNotes/screenshots',
        createdAt: new Date()
      }
    });

  } catch (err) {
    console.error('❌ Screenshot upload failed:', err);
    
    if (err.code === 401) {
      return res.status(401).json({ error: '❌ Authentication expired. Please re-authenticate.' });
    }
    
    res.status(500).json({ error: '❌ Failed to upload screenshot' });
  }
});

// Update screenshot path (for existing screenshots that need Google Drive links)
app.patch('/screenshots/:videoId/:timestamp', async (req, res) => {
  try {
    // Check authentication
    if (!req.session.tokens) {
      return res.status(401).json({ error: '❌ Not authenticated' });
    }

    const { videoId, timestamp } = req.params;
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: '❌ Missing image data' });
    }

    // Find the video
    const video = await Video.findOne({ videoId });
    if (!video) {
      return res.status(404).json({ error: '❌ Video not found' });
    }

    // Find the screenshot
    const screenshot = video.screenshots.find(s => s.timestamp == timestamp);
    if (!screenshot) {
      return res.status(404).json({ error: '❌ Screenshot not found' });
    }

    // Set OAuth credentials for Drive
    oauth2Client.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Convert base64 to buffer
    let buffer;
    try {
      buffer = Buffer.from(imageData, 'base64');
    } catch (error) {
      return res.status(400).json({ error: '❌ Invalid base64 data' });
    }

    // Generate filename
    const timestampStr = new Date(timestamp).toISOString().replace(/[:.]/g, '-');
    const fileName = `screenshot-${videoId}-${timestampStr}.png`;

    // Upload to Google Drive
    const fileMetadata = { 
      name: fileName,
      description: `Screenshot from ${video.videoTitle} at ${new Date(timestamp).toLocaleString()}`
    };
    const media = {
      mimeType: 'image/png',
      body: buffer,
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, name, size',
    });

    // Update the screenshot path with Google Drive URL
    screenshot.path = `https://drive.google.com/uc?id=${file.data.id}`;
    await video.save();

    res.json({
      message: '✅ Screenshot updated with Google Drive link',
      screenshot: {
        timestamp: timestamp,
        path: screenshot.path,
        googleDriveUrl: file.data.webViewLink
      }
    });

  } catch (err) {
    console.error('❌ Screenshot update failed:', err);
    
    if (err.code === 401) {
      return res.status(401).json({ error: '❌ Authentication expired. Please re-authenticate.' });
    }
    
    res.status(500).json({ error: '❌ Failed to update screenshot' });
  }
});

// Delete screenshot from Google Drive and database
app.delete('/screenshots/:videoId/:timestamp', getCurrentUser, requireAuth, async (req, res) => {
  try {
    const { videoId, timestamp } = req.params;

    // Find the video
    const video = await Video.findOne({ userId: req.currentUser._id, videoId });
    if (!video) {
      return res.status(404).json({ error: '❌ Video not found' });
    }

    // Find the screenshot
    const screenshotIndex = video.screenshots.findIndex(s => s.timestamp == timestamp);
    if (screenshotIndex === -1) {
      return res.status(404).json({ error: '❌ Screenshot not found' });
    }

    const screenshot = video.screenshots[screenshotIndex];

    // If it's a Google Drive URL, delete from Google Drive
    if (screenshot.path && screenshot.path.includes('drive.google.com')) {
      let fileId = null;
      
      // Extract file ID from different Google Drive URL formats
      if (screenshot.path.includes('/uc?id=')) {
        fileId = screenshot.path.split('id=')[1].split('&')[0]; // Remove any query parameters
      } else if (screenshot.path.includes('/file/d/')) {
        const match = screenshot.path.match(/\/file\/d\/([^\/]+)/);
        if (match) {
          fileId = match[1];
        }
      }
      
      if (fileId) {
        // Set OAuth credentials for Drive
        oauth2Client.setCredentials(tokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        try {
          await drive.files.delete({ fileId });
          console.log('✅ Deleted from Google Drive:', fileId);
        } catch (driveError) {
          console.error('Failed to delete from Google Drive:', driveError);
          // Continue with database deletion even if Drive deletion fails
        }
      }
    }

    // Find and delete associated note
    const associatedNoteIndex = video.notes.findIndex(note => note.screenshotPath === screenshot.path);
    if (associatedNoteIndex !== -1) {
      console.log('🔍 Found associated note at index:', associatedNoteIndex);
      video.notes.splice(associatedNoteIndex, 1);
      console.log('✅ Removed associated note from database');
    } else {
      console.log('🔍 No associated note found for this screenshot');
    }

    // Remove from database
    video.screenshots.splice(screenshotIndex, 1);
    await video.save();

    res.json({
      message: '✅ Screenshot and associated note deleted successfully from both Google Drive and database',
      deletedScreenshot: screenshot
    });

  } catch (err) {
    console.error('❌ Screenshot deletion failed:', err);
    
    if (err.code === 401) {
      return res.status(401).json({ error: '❌ Authentication expired. Please re-authenticate.' });
    }
    
    res.status(500).json({ error: '❌ Failed to delete screenshot' });
  }
});



const bookmarkRoutes = require('./routes/bookmark');
const videosRoutes = require('./routes/videos');

app.use('/bookmark', bookmarkRoutes);
app.use('/videos', videosRoutes);

const PORT = process.env.PORT || 5000;
const DB = 'mongodb://localhost:27017/ytNotes';

mongoose.connect(DB,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('🟢DB connection successful!'))
.then(() => {
  app.listen(PORT, () => {
    console.log(`🟢Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('🔴MongoDB connection error:', err);
}); 