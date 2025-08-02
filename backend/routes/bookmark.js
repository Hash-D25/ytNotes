const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { getCurrentUser, requireAuth } = require('../middleware/auth');

// GET /bookmark/:videoId - Get all bookmarks for a video
router.get('/:videoId', getCurrentUser, requireAuth, async (req, res) => {
  try {
    const video = await Video.findOne({ userId: req.currentUser._id, videoId: req.params.videoId });
    if (!video) {
      return res.json([]); // Return empty array if no bookmarks found
    }
    
    res.json(video.notes || []);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /bookmark
router.post('/', getCurrentUser, requireAuth, async (req, res) => {
     console.log('🔍 Bookmark POST request from:', req.headers.origin);
   console.log('🔍 Current user:', req.currentUser ? req.currentUser.email : 'Not found');
   console.log('🔍 Current user ID:', req.currentUser ? req.currentUser._id : 'Not found');
   
   try {
    const { videoId, videoTitle, timestamp, note, screenshot } = req.body;
    console.log('🔍 Request body:', { videoId, videoTitle, timestamp, note: note ? 'present' : 'missing', screenshot: screenshot ? 'present' : 'missing' });
    console.log('🔍 Screenshot length:', screenshot ? screenshot.length : 'none');
    console.log('🔍 Screenshot preview:', screenshot ? screenshot.substring(0, 100) + '...' : 'none');
    
    // Enhanced input validation
    if (!videoId || typeof videoId !== 'string' || videoId.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid videoId - must be a non-empty string' });
    }
    
    if (!videoTitle || typeof videoTitle !== 'string' || videoTitle.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid videoTitle - must be a non-empty string' });
    }
    
    if (typeof timestamp !== 'number' || timestamp < 0 || !Number.isFinite(timestamp)) {
      return res.status(400).json({ error: 'Invalid timestamp - must be a positive number' });
    }
    
    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      return res.status(400).json({ error: 'Invalid note - must be a non-empty string' });
    }
    
    // Sanitize inputs
    const sanitizedVideoId = videoId.trim();
    const sanitizedVideoTitle = videoTitle.trim();
    const sanitizedNote = note.trim();
    const sanitizedTimestamp = Math.floor(timestamp);

    let video = await Video.findOne({ userId: req.currentUser._id, videoId: sanitizedVideoId });
    const noteObj = { timestamp: sanitizedTimestamp, note: sanitizedNote };

         // Handle screenshot if provided
     if (screenshot) {
       try {
                      // Check if user is authenticated for Google Drive
             console.log('🔍 User tokens check:', req.currentUser.accessToken ? 'Present' : 'Missing');
             console.log('🔍 User refresh token:', req.currentUser.refreshToken ? 'Present' : 'Missing');

             // Use user's stored Google tokens for Drive integration
             const tokens = {
               access_token: req.currentUser.accessToken,
               refresh_token: req.currentUser.refreshToken
             };
             
                           if (!tokens.access_token || !tokens.refresh_token) {
                console.log('❌ User not authenticated for Google Drive - cannot save screenshot');
                console.log('⚠️ Saving note without screenshot due to missing Google tokens');
                // Continue without screenshot instead of returning error
                if (!video) {
                  video = new Video({
                    userId: req.currentUser._id,
                    videoId: sanitizedVideoId,
                    videoTitle: sanitizedVideoTitle,
                    notes: [noteObj],
                  });
                } else {
                  video.notes.push(noteObj);
                }
                return; // Exit the screenshot block
              } else {
               // Use Google Drive integration
               console.log('🔐 Starting Google Drive upload...');
               const { google } = require('googleapis');
               const oauth2Client = new google.auth.OAuth2();
               oauth2Client.setCredentials(tokens);
           const drive = google.drive({ version: 'v3', auth: oauth2Client });

          // Import helper functions
          const { getOrCreateYtNotesFolder, getOrCreateScreenshotsFolder, uploadScreenshotToDrive, makeFilePublicAndGetUrl } = require('../utils/googleDriveHelpers');

          // Create organized folder structure
          console.log('🔐 Creating ytNotes folder...');
          const ytNotesFolderId = await getOrCreateYtNotesFolder(drive);
          console.log('🔐 ytNotes folder ID:', ytNotesFolderId);
          
          console.log('🔐 Creating screenshots folder...');
          const screenshotsFolderId = await getOrCreateScreenshotsFolder(drive, ytNotesFolderId);
          console.log('🔐 Screenshots folder ID:', screenshotsFolderId);

          // Generate proper filename
          const timestampStr = new Date(sanitizedTimestamp * 1000).toISOString().replace(/[:.]/g, '-');
          const fileName = `${sanitizedVideoId}_${timestampStr}.png`;

          // Remove data URL prefix
          const base64Data = screenshot.replace(/^data:image\/png;base64,/, '');

          // Upload to Google Drive
          console.log('🔐 Uploading screenshot to Google Drive...');
          const fileId = await uploadScreenshotToDrive(drive, screenshotsFolderId, base64Data, fileName);
          console.log('🔐 File uploaded, ID:', fileId);
          
          console.log('🔐 Making file public...');
          const shareableLink = await makeFilePublicAndGetUrl(drive, fileId);
          console.log('🔐 Shareable link:', shareableLink);

          // Add screenshot to note and screenshots array
          noteObj.screenshotPath = shareableLink;
          const screenshotObj = {
            timestamp: sanitizedTimestamp,
            path: shareableLink,
            createdAt: new Date()
          };

          if (!video) {
            video = new Video({
              userId: req.currentUser._id,
              videoId: sanitizedVideoId,
              videoTitle: sanitizedVideoTitle,
              notes: [noteObj],
              screenshots: [screenshotObj]
            });
          } else {
            video.notes.push(noteObj);
            video.screenshots.push(screenshotObj);
          }
        }
             } catch (screenshotError) {
         console.error('❌ Screenshot save error:', screenshotError);
         console.error('❌ Error stack:', screenshotError.stack);
         // Continue without screenshot if there's an error
        if (!video) {
          video = new Video({
            userId: req.currentUser._id,
            videoId: sanitizedVideoId,
            videoTitle: sanitizedVideoTitle,
            notes: [noteObj],
          });
        } else {
          video.notes.push(noteObj);
        }
      }
    } else {
      if (!video) {
        video = new Video({
          userId: req.currentUser._id,
          videoId: sanitizedVideoId,
          videoTitle: sanitizedVideoTitle,
          notes: [noteObj],
        });
      } else {
        video.notes.push(noteObj);
      }
    }

    await video.save();
    res.status(201).json({ success: true, video });
  } catch (err) {
    console.error('Bookmark save error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PATCH /bookmark/:videoId/:noteIdx
router.patch('/:videoId/:noteIdx', getCurrentUser, requireAuth, async (req, res) => {
  try {
    const { note } = req.body;
    const video = await Video.findOne({ userId: req.currentUser._id, videoId: req.params.videoId });
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
router.delete('/:videoId/:noteIdx', getCurrentUser, requireAuth, async (req, res) => {
  try {
    const video = await Video.findOne({ userId: req.currentUser._id, videoId: req.params.videoId });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    const noteIdx = parseInt(req.params.noteIdx);
    if (!video.notes[noteIdx]) return res.status(404).json({ error: 'Note not found' });
    
    const note = video.notes[noteIdx];
    
    // If the note has an associated screenshot, delete it too
    if (note.screenshotPath) {
      console.log('🔍 Note has associated screenshot:', note.screenshotPath);
      
      // Find the corresponding screenshot in the screenshots array
      const screenshotIndex = video.screenshots.findIndex(s => s.path === note.screenshotPath);
      
      if (screenshotIndex !== -1) {
        console.log('🔍 Found associated screenshot at index:', screenshotIndex);
        
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
            // Use user's stored Google tokens for Drive integration
            const tokens = {
              access_token: req.currentUser.accessToken,
              refresh_token: req.currentUser.refreshToken
            };
            
            if (tokens.access_token && tokens.refresh_token) {
              // Set OAuth credentials for Drive
              const oauth2Client = new google.auth.OAuth2();
              oauth2Client.setCredentials(tokens);
              const drive = google.drive({ version: 'v3', auth: oauth2Client });

              try {
                await drive.files.delete({ fileId });
                console.log('✅ Deleted associated screenshot from Google Drive:', fileId);
              } catch (driveError) {
                console.error('Failed to delete associated screenshot from Google Drive:', driveError);
                // Continue with database deletion even if Drive deletion fails
              }
            }
          }
        } else {
          // Delete local file if it exists
          const filepath = path.join(__dirname, '..', screenshot.path);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            console.log('✅ Deleted associated local screenshot:', filepath);
          }
        }
        
        // Remove screenshot from database
        video.screenshots.splice(screenshotIndex, 1);
        console.log('✅ Removed associated screenshot from database');
      }
    }
    
    // Remove the note from database
    video.notes.splice(noteIdx, 1);
    
    // Check if video has no notes left
    if (video.notes.length === 0 && video.screenshots.length === 0) {
      console.log('🗑️ Video has no notes or screenshots left - deleting entire video');
      await Video.deleteOne({ videoId: req.params.videoId });
      console.log('✅ Video deleted from database');
      res.json({ success: true, videoDeleted: true, message: 'Video deleted (no content left)' });
    } else {
      await video.save();
      console.log('✅ Note and associated screenshot deleted successfully');
      res.json({ success: true, video });
    }
  } catch (err) {
    console.error('❌ Note deletion failed:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// PATCH /bookmark/:videoId/:noteIdx/like
router.patch('/:videoId/:noteIdx/like', getCurrentUser, requireAuth, async (req, res) => {
  try {
    const { liked } = req.body;
    console.log('Like toggle request:', {
      videoId: req.params.videoId,
      noteIdx: req.params.noteIdx,
      liked: liked
    });
    
    const video = await Video.findOne({ userId: req.currentUser._id, videoId: req.params.videoId });
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
router.get('/:videoId/screenshots', getCurrentUser, requireAuth, async (req, res) => {
  try {
    const video = await Video.findOne({ userId: req.currentUser._id, videoId: req.params.videoId });
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
router.delete('/:videoId/screenshots/:screenshotIdx', getCurrentUser, requireAuth, async (req, res) => {
  try {
    const video = await Video.findOne({ userId: req.currentUser._id, videoId: req.params.videoId });
    if (!video) return res.status(404).json({ error: 'Video not found' });
    
    const screenshotIdx = parseInt(req.params.screenshotIdx);
    if (!video.screenshots[screenshotIdx]) return res.status(404).json({ error: 'Screenshot not found' });
    
    const screenshot = video.screenshots[screenshotIdx];
    console.log('🔍 Deleting screenshot:', screenshot.path);
    
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
        // Use user's stored Google tokens for Drive integration
        const tokens = {
          access_token: req.currentUser.accessToken,
          refresh_token: req.currentUser.refreshToken
        };
        
        if (tokens.access_token && tokens.refresh_token) {
          // Set OAuth credentials for Drive
          const oauth2Client = new google.auth.OAuth2();
          oauth2Client.setCredentials(tokens);
          const drive = google.drive({ version: 'v3', auth: oauth2Client });

          try {
            await drive.files.delete({ fileId });
            console.log('✅ Deleted screenshot from Google Drive:', fileId);
          } catch (driveError) {
            console.error('Failed to delete screenshot from Google Drive:', driveError);
            // Continue with database deletion even if Drive deletion fails
          }
        }
      }
    } else {
      // Delete local file if it exists
      const filepath = path.join(__dirname, '..', screenshot.path);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log('✅ Deleted local screenshot:', filepath);
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
    
    // Remove screenshot from database
    video.screenshots.splice(screenshotIdx, 1);
    
    // Check if video has no notes left
    if (video.notes.length === 0 && video.screenshots.length === 0) {
      console.log('🗑️ Video has no notes or screenshots left - deleting entire video');
      await Video.deleteOne({ userId: req.currentUser._id, videoId: req.params.videoId });
      console.log('✅ Video deleted from database');
      res.json({ success: true, videoDeleted: true, message: 'Video deleted (no content left)' });
    } else {
      await video.save();
      console.log('✅ Screenshot and associated note deleted successfully');
      res.json({ success: true, video });
    }
  } catch (err) {
    console.error('❌ Screenshot deletion failed:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router; 