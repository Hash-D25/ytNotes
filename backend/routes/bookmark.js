const express = require('express');
const router = express.Router();
const Video = require('../models/Video');

// POST /bookmark
router.post('/', async (req, res) => {
  try {
    const { videoId, videoTitle, timestamp, note } = req.body;
    if (!videoId || !videoTitle || typeof timestamp !== 'number' || !note) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let video = await Video.findOne({ videoId });
    const noteObj = { timestamp, note };

    if (!video) {
      // First bookmark for this video
      video = new Video({
        videoId,
        videoTitle,
        notes: [noteObj],
      });
      await video.save();
    } else {
      // Append note
      video.notes.push(noteObj);
      await video.save();
    }

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
    const video = await Video.findOne({ videoId: req.params.videoId });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    if (!video.notes[req.params.noteIdx]) return res.status(404).json({ error: 'Note not found' });
    video.notes[req.params.noteIdx].liked = liked;
    await video.save();
    res.json({ success: true, video });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router; 