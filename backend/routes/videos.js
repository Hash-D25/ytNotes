const express = require('express');
const router = express.Router();
const Video = require('../models/Video');

// GET /videos
router.get('/', async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /videos/favorites
router.get('/favorites', async (req, res) => {
  try {
    const favorites = await Video.find({ favorite: true }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PATCH /videos/:videoId/favorite
router.patch('/:videoId/favorite', async (req, res) => {
  try {
    const { favorite } = req.body;
    const video = await Video.findOneAndUpdate(
      { videoId: req.params.videoId },
      { $set: { favorite } },
      { new: true }
    );
    if (!video) return res.status(404).json({ error: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// DELETE /videos/:videoId
router.delete('/:videoId', async (req, res) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    // Delete associated screenshots from filesystem and Google Drive
    if (video.screenshots && video.screenshots.length > 0) {
      const fs = require('fs');
      const path = require('path');
      const { google } = require('googleapis');
      const { getTokens } = require('../utils/tokenStore');
      
      // Get Google Drive tokens
      const tokens = getTokens();
      if (tokens) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        oauth2Client.setCredentials(tokens);
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        for (const screenshot of video.screenshots) {
          if (screenshot.path && screenshot.path.includes('drive.google.com')) {
            try {
              // Extract file ID from Google Drive URL
              let fileId;
              if (screenshot.path.includes('/uc?id=')) {
                fileId = screenshot.path.split('id=')[1].split('&')[0]; // Remove any query parameters
              } else if (screenshot.path.includes('/file/d/')) {
                const match = screenshot.path.match(/\/file\/d\/([^\/]+)/);
                if (match) {
                  fileId = match[1];
                }
              }
              
              if (fileId) {
                console.log(`🗑️ Deleting Google Drive file: ${fileId}`);
                await drive.files.delete({ fileId });
                console.log(`✅ Successfully deleted Google Drive file: ${fileId}`);
              }
            } catch (error) {
              console.error(`❌ Failed to delete Google Drive file: ${screenshot.path}`, error);
            }
          } else if (screenshot.path && !screenshot.path.startsWith('http')) {
            // Delete from local filesystem if it's a local file
            const filepath = path.join(__dirname, '..', screenshot.path);
            if (fs.existsSync(filepath)) {
              fs.unlinkSync(filepath);
              console.log(`✅ Deleted local file: ${filepath}`);
            }
          }
        }
      } else {
        console.log('⚠️ No Google Drive tokens available for cleanup');
      }
    }
    
    // Delete the video from database
    await Video.deleteOne({ videoId: req.params.videoId });
    console.log(`✅ Deleted video from database: ${req.params.videoId}`);
    
    res.json({ success: true, message: 'Video and all associated screenshots deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting video:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router; 