const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  timestamp: { type: Number, required: true },
  note: { type: String, required: true },
  screenshotPath: { type: String, default: null }, // Path to screenshot file
  createdAt: { type: Date, default: Date.now },
  liked: { type: Boolean, default: false },
});

const screenshotSchema = new mongoose.Schema({
  timestamp: { type: Number, required: true },
  path: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const videoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videoId: { type: String, required: true },
  videoTitle: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  notes: [noteSchema],
  screenshots: [screenshotSchema],
  favorite: { type: Boolean, default: false },
});

// Compound index to ensure unique videoId per user
videoSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('Video', videoSchema); 