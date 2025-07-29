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
    
    // Delete associated screenshots from filesystem
    if (video.screenshots && video.screenshots.length > 0) {
      const fs = require('fs');
      const path = require('path');
      
      video.screenshots.forEach(screenshot => {
        const filepath = path.join(__dirname, '..', screenshot.path);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      });
    }
    
    // Delete the video from database
    await Video.deleteOne({ videoId: req.params.videoId });
    
    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router; 