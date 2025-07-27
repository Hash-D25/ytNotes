const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

dotenv.config({path: './config.env'});

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from screenshots directory
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

// Health check
app.get('/', (req, res) => {
  res.send('API is running');
});

const bookmarkRoutes = require('./routes/bookmark');
const videosRoutes = require('./routes/videos');

app.use('/bookmark', bookmarkRoutes);
app.use('/videos', videosRoutes);

const PORT = process.env.PORT || 3000;
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