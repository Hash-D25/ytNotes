const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

dotenv.config({path: './.env'});

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

const app = express();

// Import JWT utilities and auth middleware
const { generateAccessToken, generateRefreshToken, verifyToken, extractTokenFromHeader } = require('./utils/jwtUtils');
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
    
    // Allow Chrome extension origins (they start with chrome-extension://)
    if (origin.startsWith('chrome-extension://')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));
// Enhanced JSON body parser with better error handling
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('❌ Malformed JSON received:', {
        url: req.url,
        method: req.method,
        contentType: req.headers['content-type'],
        bodyLength: buf.length,
        bodyPreview: buf.toString().substring(0, 200)
      });
      throw new Error('Malformed JSON');
    }
  }
}));

// Handle preflight requests
app.options('*', cors());

// Global error handler for JSON parsing errors
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ JSON parsing error:', {
      url: req.url,
      method: req.method,
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent']
    });
    return res.status(400).json({ 
      error: 'Invalid JSON format',
      message: 'The request body contains malformed JSON'
    });
  }
  next(error);
});

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

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
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
  res.send('API is running');
});

// Debug endpoint to check user status (temporary)
app.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find({}, 'email lastLogin');
    res.json({
      totalUsers: users.length,
      users: users.map(user => ({
        email: user.email,
        lastLogin: user.lastLogin,
        isActive: user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 5 * 60 * 1000)
      }))
    });
  } catch (error) {
    console.error('Debug users error:', error);
    res.status(500).json({ error: 'Failed to get debug info' });
  }
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
    prompt: 'consent' // Force consent to get refresh token
  });
  
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
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
    
    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    console.log('🔐 JWT tokens generated for user:', user.email);
    
    // Redirect to frontend with tokens
    const redirectUrl = `http://localhost:5173/auth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ Error getting tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

// JWT token refresh endpoint
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Generate new access token
    const newAccessToken = generateAccessToken(user);
    
    res.json({
      accessToken: newAccessToken,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Check authentication status (for extension)
app.get('/auth/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return res.json({ authenticated: false, message: 'No token provided' });
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.json({ authenticated: false, message: 'Invalid or expired token' });
    }
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.json({ authenticated: false, message: 'User not found' });
    }
    
    res.json({
      authenticated: true,
      message: 'User is authenticated',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('❌ Auth status check error:', error);
    res.json({ authenticated: false, message: 'Authentication check failed' });
  }
});

// Logout endpoint (for dashboard)
app.post('/auth/logout', async (req, res) => {
  try {
    
    // Extract token from header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (token) {
      // Verify token to get user info
      const decoded = verifyToken(token);
      
      if (decoded && decoded.userId) {
        // Update user's lastLogin to mark them as inactive
        await User.findByIdAndUpdate(decoded.userId, {
          lastLogin: null // Mark as inactive
        });
      }
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Force re-authentication endpoint (for expired tokens)
app.get('/auth/reauth', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Force consent to get refresh token
  });
  
  res.redirect(authUrl);
});

// Get user profile information
app.get('/auth/profile', getCurrentUser, requireAuth, async (req, res) => {
  try {
    res.json({
      name: req.currentUser.name,
      email: req.currentUser.email,
      picture: req.currentUser.picture,
      id: req.currentUser._id
    });
  } catch (err) {
    console.error('❌ Failed to get user profile:', err);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Check if Google Drive is available (for extension)
app.get('/auth/drive-available', getCurrentUser, requireAuth, (req, res) => {
  const hasTokens = req.currentUser.accessToken && req.currentUser.refreshToken;
  res.json({ 
    available: hasTokens,
    message: hasTokens ? 'Google Drive available' : 'Google Drive not available'
  });
});

// Google Drive upload route
app.post('/upload-to-drive', getCurrentUser, requireAuth, async (req, res) => {
  try {
    // Validate input
    const { fileName, fileData } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'Missing fileName or fileData' });
    }

    // Set OAuth credentials using user's stored tokens
    oauth2Client.setCredentials({
      access_token: req.currentUser.accessToken,
      refresh_token: req.currentUser.refreshToken
    });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Convert base64 to buffer
    let buffer;
    try {
      buffer = Buffer.from(fileData, 'base64');
    } catch (error) {
      return res.status(400).json({ error: 'Invalid base64 data' });
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
      message: 'Uploaded to Google Drive', 
      link: file.data.webViewLink,
      fileId: file.data.id,
      fileName: file.data.name,
      fileSize: file.data.size
    });
  } catch (err) {
    console.error('Upload failed:', err);
    
    // Handle specific Google API errors
    if (err.code === 401) {
      return res.status(401).json({ error: 'Authentication expired. Please re-authenticate.' });
    }
    
    res.status(500).json({ error: 'Failed to upload to Google Drive' });
  }
});

// List files from Google Drive
app.get('/drive/files', getCurrentUser, requireAuth, async (req, res) => {
  try {
    // Set OAuth credentials using user's stored tokens
    oauth2Client.setCredentials({
      access_token: req.currentUser.accessToken,
      refresh_token: req.currentUser.refreshToken
    });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.list({
      pageSize: 20,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink)',
      orderBy: 'createdTime desc'
    });

    res.json({ 
      files: response.data.files,
      message: 'Files retrieved successfully'
    });
  } catch (err) {
    console.error('Failed to list files:', err);
    
    if (err.code === 401) {
      return res.status(401).json({ error: 'Authentication expired. Please re-authenticate.' });
    }
    
    res.status(500).json({ error: 'Failed to retrieve files from Google Drive' });
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
app.post('/upload-screenshot', getCurrentUser, requireAuth, async (req, res) => {
  try {
    // Validate input
    const { imageData, videoId, timestamp } = req.body;
    if (!imageData || !videoId || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the video for this user
    const video = await Video.findOne({ userId: req.currentUser._id, videoId });
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Set OAuth credentials for Drive using user's stored tokens
    oauth2Client.setCredentials({
      access_token: req.currentUser.accessToken,
      refresh_token: req.currentUser.refreshToken
    });
    
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
      message: 'Screenshot uploaded successfully to organized Google Drive folder',
      screenshot: {
        timestamp: timestamp,
        path: shareableLink,
        fileName: fileName,
        folderStructure: 'ytNotes/screenshots',
        createdAt: new Date()
      }
    });

  } catch (err) {
    console.error('Screenshot upload failed:', err);
    
    if (err.code === 401) {
      return res.status(401).json({ error: 'Authentication expired. Please re-authenticate.' });
    }
    
    res.status(500).json({ error: 'Failed to upload screenshot' });
  }
});

// Update screenshot path (for existing screenshots that need Google Drive links)
app.patch('/screenshots/:videoId/:timestamp', getCurrentUser, requireAuth, async (req, res) => {
  try {
    const { videoId, timestamp } = req.params;
    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Missing image data' });
    }

    // Find the video for this user
    const video = await Video.findOne({ userId: req.currentUser._id, videoId });
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Find the screenshot
    const screenshot = video.screenshots.find(s => s.timestamp == timestamp);
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    // Set OAuth credentials for Drive using user's stored tokens
    oauth2Client.setCredentials({
      access_token: req.currentUser.accessToken,
      refresh_token: req.currentUser.refreshToken
    });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Convert base64 to buffer
    let buffer;
    try {
      buffer = Buffer.from(imageData, 'base64');
    } catch (error) {
      return res.status(400).json({ error: 'Invalid base64 data' });
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
      message: 'Screenshot updated with Google Drive link',
      screenshot: {
        timestamp: timestamp,
        path: screenshot.path,
        googleDriveUrl: file.data.webViewLink
      }
    });

  } catch (err) {
    console.error('Screenshot update failed:', err);
    
    if (err.code === 401) {
      return res.status(401).json({ error: 'Authentication expired. Please re-authenticate.' });
    }
    
    res.status(500).json({ error: 'Failed to update screenshot' });
  }
});

// Delete screenshot from Google Drive and database
app.delete('/screenshots/:videoId/:timestamp', getCurrentUser, requireAuth, async (req, res) => {
  try {
    const { videoId, timestamp } = req.params;

    // Find the video for this user
    const video = await Video.findOne({ userId: req.currentUser._id, videoId });
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Find the screenshot
    const screenshotIndex = video.screenshots.findIndex(s => s.timestamp == timestamp);
    if (screenshotIndex === -1) {
      return res.status(404).json({ error: 'Screenshot not found' });
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
        // Set OAuth credentials for Drive using user's stored tokens
        oauth2Client.setCredentials({
          access_token: req.currentUser.accessToken,
          refresh_token: req.currentUser.refreshToken
        });
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        try {
          await drive.files.delete({ fileId });
        } catch (driveError) {
          console.error('Failed to delete from Google Drive:', driveError);
          // Continue with database deletion even if Drive deletion fails
        }
      }
    }

    // Find and delete associated note
    const associatedNoteIndex = video.notes.findIndex(note => note.screenshotPath === screenshot.path);
    if (associatedNoteIndex !== -1) {
      video.notes.splice(associatedNoteIndex, 1);
    }

    // Remove from database
    video.screenshots.splice(screenshotIndex, 1);
    await video.save();

    res.json({
      message: 'Screenshot and associated note deleted successfully from both Google Drive and database',
      deletedScreenshot: screenshot
    });

  } catch (err) {
    console.error('Screenshot deletion failed:', err);
    
    if (err.code === 401) {
      return res.status(401).json({ error: 'Authentication expired. Please re-authenticate.' });
    }
    
    res.status(500).json({ error: 'Failed to delete screenshot' });
  }
});

// Export screenshots as PDF endpoint
app.get('/export-screenshots-pdf/:videoId', getCurrentUser, requireAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Find the video for this user
    const video = await Video.findOne({ userId: req.currentUser._id, videoId });
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if there are screenshots
    if (!video.screenshots || video.screenshots.length === 0) {
      return res.status(400).json({ error: 'No screenshots found for this video' });
    }

    // Import pdf-lib
    const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Sort screenshots by timestamp
    const sortedScreenshots = [...video.screenshots].sort((a, b) => a.timestamp - b.timestamp);
    
    // Process each screenshot - create custom-sized pages for each screenshot
    for (let i = 0; i < sortedScreenshots.length; i++) {
      const screenshot = sortedScreenshots[i];
      
      try {
        // Fetch the image from Google Drive
        const imageResponse = await fetch(screenshot.path);
        if (!imageResponse.ok) {
          console.warn(`Failed to fetch image for timestamp ${screenshot.timestamp}:`, imageResponse.status);
          continue;
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        const image = await pdfDoc.embedPng(imageBuffer);
        
        // Create a page sized to match the screenshot dimensions
        // Add small margins for better presentation
        const margin = 20;
        const pageWidth = image.width + (2 * margin);
        const pageHeight = image.height + (2 * margin);
        
        // Create new page with custom dimensions
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        
        // Draw the image at full size, centered on the page
        page.drawImage(image, {
          x: margin,
          y: margin,
          width: image.width,
          height: image.height
        });
        
      } catch (imageError) {
        console.error(`Error processing screenshot for timestamp ${screenshot.timestamp}:`, imageError);
        // Skip failed images and continue with next
      }
    }
    
    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${video.videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}_screenshots.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    
    // Send the PDF
    res.send(Buffer.from(pdfBytes));
    
  } catch (err) {
    console.error('PDF export failed:', err);
    res.status(500).json({ error: 'Failed to export PDF', details: err.message });
  }
});

// Export notes as PDF endpoint
app.get('/export-notes-pdf/:videoId', getCurrentUser, requireAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Find the video for this user
    const video = await Video.findOne({ userId: req.currentUser._id, videoId });
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if there are notes
    if (!video.notes || video.notes.length === 0) {
      return res.status(400).json({ error: 'No notes found for this video' });
    }

    // Import pdf-lib
    const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Sort notes by timestamp
    const sortedNotes = [...video.notes].sort((a, b) => a.timestamp - b.timestamp);
    
    // Add title page
    const titlePage = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const titleFontSize = 24;
    const titleText = `${video.videoTitle} - Notes`;
    const titleWidth = boldFont.widthOfTextAtSize(titleText, titleFontSize);
    const titleX = (titlePage.getWidth() - titleWidth) / 2;
    titlePage.drawText(titleText, {
      x: titleX,
      y: titlePage.getHeight() - 50,
      size: titleFontSize,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    
    // Add subtitle
    const subtitleText = `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
    const subtitleFontSize = 12;
    const subtitleWidth = font.widthOfTextAtSize(subtitleText, subtitleFontSize);
    const subtitleX = (titlePage.getWidth() - subtitleWidth) / 2;
    titlePage.drawText(subtitleText, {
      x: subtitleX,
      y: titlePage.getHeight() - 80,
      size: subtitleFontSize,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });
    
    // Add video info
    const infoText = `Total Notes: ${sortedNotes.length}`;
    const infoWidth = font.widthOfTextAtSize(infoText, subtitleFontSize);
    const infoX = (titlePage.getWidth() - infoWidth) / 2;
    titlePage.drawText(infoText, {
      x: infoX,
      y: titlePage.getHeight() - 110,
      size: subtitleFontSize,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    // Process each note
    for (let i = 0; i < sortedNotes.length; i++) {
      const note = sortedNotes[i];
      
      // Create a new page for each note
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const pageWidth = page.getWidth();
      const pageHeight = page.getHeight();
      const margin = 50;
      
      // Add timestamp header
      const timestampText = `Timestamp: ${formatTime(note.timestamp)}`;
      const timestampFontSize = 16;
      const timestampWidth = boldFont.widthOfTextAtSize(timestampText, timestampFontSize);
      const timestampX = (pageWidth - timestampWidth) / 2;
      
      page.drawText(timestampText, {
        x: timestampX,
        y: pageHeight - margin,
        size: timestampFontSize,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      // Add note content
      const noteText = note.note;
      const noteFontSize = 12;
      const maxWidth = pageWidth - (2 * margin);
      const maxHeight = pageHeight - (2 * margin) - 100; // Leave space for header and footer
      
      // Simple text wrapping
      const words = noteText.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = font.widthOfTextAtSize(testLine, noteFontSize);
        
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Word is too long, break it
            lines.push(word);
          }
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // Draw note lines
      let yPosition = pageHeight - margin - 50;
      for (const line of lines) {
        if (yPosition < margin + 50) {
          // Add new page if we run out of space
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          yPosition = newPage.getHeight() - margin - 50;
        }
        
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: noteFontSize,
          font: font,
          color: rgb(0, 0, 0)
        });
        
        yPosition -= noteFontSize + 5;
      }
      
      // Add creation date
      const dateText = `Created: ${new Date(note.createdAt).toLocaleDateString()}`;
      const dateFontSize = 10;
      const dateWidth = font.widthOfTextAtSize(dateText, dateFontSize);
      const dateX = (pageWidth - dateWidth) / 2;
      
      page.drawText(dateText, {
        x: dateX,
        y: margin + 20,
        size: dateFontSize,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });
      
      // Add page number
      const pageText = `Page ${i + 1} of ${sortedNotes.length}`;
      const pageFontSize = 10;
      const pageWidth_text = font.widthOfTextAtSize(pageText, pageFontSize);
      const pageX = (pageWidth - pageWidth_text) / 2;
      
      page.drawText(pageText, {
        x: pageX,
        y: margin / 2,
        size: pageFontSize,
        font: font,
        color: rgb(0.3, 0.3, 0.3)
      });
    }
    
    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${video.videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}_notes.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    
    // Send the PDF
    res.send(Buffer.from(pdfBytes));
    
  } catch (err) {
    console.error('PDF export failed:', err);
    res.status(500).json({ error: 'Failed to export PDF', details: err.message });
  }
});

// Helper function to format time
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

const bookmarkRoutes = require('./routes/bookmark');
const videosRoutes = require('./routes/videos');
const adminRoutes = require('./routes/admin');

app.use('/bookmark', bookmarkRoutes);
app.use('/videos', videosRoutes);
app.use('/admin', adminRoutes);

// Temporary endpoint for generating test tokens (for debugging)
app.get('/auth/test-tokens', async (req, res) => {
  try {
    // Create a test user or find existing user
    let user = await User.findOne();
    
    if (!user) {
      // Create a test user
      user = new User({
        googleId: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://via.placeholder.com/150',
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token'
      });
      await user.save();
      console.log('✅ Test user created');
    }
    
    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    console.log('🔐 Test tokens generated for user:', user.email);
    
    res.json({
      accessToken,
      refreshToken,
      message: 'Test tokens generated successfully'
    });
  } catch (error) {
    console.error('❌ Error generating test tokens:', error);
    res.status(500).json({ error: 'Failed to generate test tokens' });
  }
});

// Temporary endpoint to fix missing refresh token (for debugging)
app.get('/auth/fix-refresh-token', async (req, res) => {
  try {
    const user = await User.findOne({ email: 'seenew1729@gmail.com' });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('🔍 Current user tokens:', {
      hasAccessToken: !!user.accessToken,
      hasRefreshToken: !!user.refreshToken,
      email: user.email
    });
    
    // For now, let's set a dummy refresh token to test
    user.refreshToken = 'dummy-refresh-token-for-testing';
    await user.save();
    
    console.log('✅ Refresh token updated for user:', user.email);
    
    res.json({
      message: 'Refresh token updated',
      user: {
        email: user.email,
        hasAccessToken: !!user.accessToken,
        hasRefreshToken: !!user.refreshToken
      }
    });
  } catch (error) {
    console.error('❌ Error fixing refresh token:', error);
    res.status(500).json({ error: 'Failed to fix refresh token' });
  }
});

const PORT = process.env.PORT;
const DB = process.env.DATABASE;

mongoose.connect(DB,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('🟢DB connection successful!');
  app.listen(PORT, () => {
    console.log(`🟢Server running on port ${PORT}`);
  });
})
.catch((err) => {
  console.error('🔴MongoDB connection error:', err);
  process.exit(1); // Exit if DB connection fails
}); 