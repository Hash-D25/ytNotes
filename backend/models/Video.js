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
  videoId: { type: String, required: true, unique: true },
  videoTitle: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  notes: [noteSchema],
  screenshots: [screenshotSchema],
  favorite: { type: Boolean, default: false },
});

module.exports = mongoose.model('Video', videoSchema); 