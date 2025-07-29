const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');

// GET /bookmark/:videoId - Get all bookmarks for a video
router.get('/:videoId', async (req, res) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId });
    if (!video) {
      return res.json([]); // Return empty array if no bookmarks found
    }
    
    res.json(video.notes || []);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /bookmark
router.post('/', async (req, res) => {
  try {
    const { videoId, videoTitle, timestamp, note, screenshot } = req.body;
    if (!videoId || !videoTitle || typeof timestamp !== 'number' || !note) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let video = await Video.findOne({ videoId });
    const noteObj = { timestamp, note };

    // Handle screenshot if provided
    if (screenshot) {
      try {
        // Create screenshots directory if it doesn't exist
        const screenshotsDir = path.join(__dirname, '../screenshots');
        if (!fs.existsSync(screenshotsDir)) {
          fs.mkdirSync(screenshotsDir, { recursive: true });
        }

        // Generate filename with videoId and timestamp
        const filename = `${videoId}_${timestamp}_${Date.now()}.png`;
        const filepath = path.join(screenshotsDir, filename);

        // Remove data URL prefix and save base64 image
        const base64Data = screenshot.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(filepath, base64Data, 'base64');

        // Add screenshot path to note
        noteObj.screenshotPath = `/screenshots/${filename}`;

        // Also add to screenshots array
        const screenshotObj = {
          timestamp,
          path: `/screenshots/${filename}`,
          createdAt: new Date()
        };

        if (!video) {
          video = new Video({
            videoId,
            videoTitle,
            notes: [noteObj],
            screenshots: [screenshotObj]
          });
        } else {
          video.notes.push(noteObj);
          video.screenshots.push(screenshotObj);
        }
      } catch (screenshotError) {
        console.error('Screenshot save error:', screenshotError);
        // Continue without screenshot if there's an error
        if (!video) {
          video = new Video({
            videoId,
            videoTitle,
            notes: [noteObj],
          });
        } else {
          video.notes.push(noteObj);
        }
      }
    } else {
      if (!video) {
        video = new Video({
          videoId,
          videoTitle,
          notes: [noteObj],
        });
      } else {
        video.notes.push(noteObj);
      }
    }

    await video.save();
    res.status(201).json({ success: true, video });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PATCH /bookmark/:videoId/:noteIdx
router.patch('/:videoId/:noteIdx', async (req, res) => {
  try {
    const { note } = req.body;
    const video = await Video.findOne({ videoId: req.params.videoId });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (!video.notes[req.params.noteIdx]) return res.status(404).json({ error: 'Note not found' });
    video.notes[req.params.noteIdx].note = note;
    await video.save();
    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// DELETE /bookmark/:videoId/:noteIdx
router.delete('/:videoId/:noteIdx', async (req, res) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (!video.notes[req.params.noteIdx]) return res.status(404).json({ error: 'Note not found' });
    video.notes.splice(req.params.noteIdx, 1);
    await video.save();
    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PATCH /bookmark/:videoId/:noteIdx/like
router.patch('/:videoId/:noteIdx/like', async (req, res) => {
  try {
    const { liked } = req.body;
    console.log('Like toggle request:', {
      videoId: req.params.videoId,
      noteIdx: req.params.noteIdx,
      liked: liked
    });
    
    const video = await Video.findOne({ videoId: req.params.videoId });
    if (!video) {
      console.log('Video not found:', req.params.videoId);
      return res.status(404).json({ error: 'Video not found' });
    }
    
    const noteIdx = parseInt(req.params.noteIdx);
    if (!video.notes[noteIdx]) {
      console.log('Note not found at index:', noteIdx, 'Total notes:', video.notes.length);
      return res.status(404).json({ error: 'Note not found' });
    }
    
    console.log('Updating note like status:', {
      noteIdx: noteIdx,
      oldLiked: video.notes[noteIdx].liked,
      newLiked: liked
    });
    
    video.notes[noteIdx].liked = liked;
    await video.save();
    
    console.log('Like toggle successful');
    res.json({ success: true, video });
  } catch (err) {
    console.error('Like toggle error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /bookmark/:videoId/screenshots
router.get('/:videoId/screenshots', async (req, res) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId });
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json({ 
      success: true, 
      screenshots: video.screenshots || [] 
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// DELETE /bookmark/:videoId/screenshots/:screenshotIdx
router.delete('/:videoId/screenshots/:screenshotIdx', async (req, res) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    const screenshotIdx = parseInt(req.params.screenshotIdx);
    if (!video.screenshots[screenshotIdx]) return res.status(404).json({ error: 'Screenshot not found' });
    
    // Delete the file from filesystem
    const screenshotPath = video.screenshots[screenshotIdx].path;
    const filepath = path.join(__dirname, '..', screenshotPath);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    
    // Remove from database
    video.screenshots.splice(screenshotIdx, 1);
    await video.save();
    
    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router; 