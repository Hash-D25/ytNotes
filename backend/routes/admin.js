const express = require('express');
const router = express.Router();
const { getCurrentUser, requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Video = require('../models/Video');

// Admin email addresses from environment variables
const ADMIN_EMAILS = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : [];

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!ADMIN_EMAILS.includes(req.currentUser.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get admin statistics
router.get('/stats', getCurrentUser, requireAuth, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();

    // Get currently active users (logged in within last 5 minutes and not null)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    console.log('🔍 Admin stats - Five minutes ago:', fiveMinutesAgo);
    
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: fiveMinutesAgo, $ne: null } 
    });
    
    // Debug: Get all users and their lastLogin status
    const allUsers = await User.find({}, 'email lastLogin');
    console.log('🔍 Admin stats - All users:', allUsers.map(u => ({
      email: u.email,
      lastLogin: u.lastLogin,
      isActive: u.lastLogin && new Date(u.lastLogin) > fiveMinutesAgo
    })));
    
    console.log('🔍 Admin stats - Active users count:', activeUsers);

    // Get total videos
    const totalVideos = await Video.countDocuments();

    // Get total notes across all videos
    const videosWithNotes = await Video.find({}, 'notes');
    const totalNotes = videosWithNotes.reduce((total, video) => {
      return total + (video.notes ? video.notes.length : 0);
    }, 0);

    // Get total favorites
    const totalFavorites = await Video.countDocuments({ favorite: true });

    // Get recent activity (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentUsers = await User.find({ 
      lastLogin: { $gte: twentyFourHoursAgo } 
    }).countDocuments();

    const recentVideos = await Video.find({ 
      createdAt: { $gte: twentyFourHoursAgo } 
    }).countDocuments();

    const recentActivity = [];

    // Add user activity
    if (recentUsers > 0) {
      recentActivity.push({
        type: 'user',
        message: `${recentUsers} new user(s) logged in`,
        timestamp: new Date()
      });
    }

    // Add video activity
    if (recentVideos > 0) {
      recentActivity.push({
        type: 'video',
        message: `${recentVideos} new video(s) bookmarked`,
        timestamp: new Date()
      });
    }

    // Add note activity (simplified - could be enhanced with actual note creation tracking)
    const recentVideosWithNotes = await Video.find({
      'notes.createdAt': { $gte: twentyFourHoursAgo }
    });
    
    const recentNotes = recentVideosWithNotes.reduce((total, video) => {
      if (video.notes) {
        return total + video.notes.filter(note => 
          note.createdAt && new Date(note.createdAt) >= twentyFourHoursAgo
        ).length;
      }
      return total;
    }, 0);

    if (recentNotes > 0) {
      recentActivity.push({
        type: 'note',
        message: `${recentNotes} new note(s) created`,
        timestamp: new Date()
      });
    }

    // Sort activity by timestamp (most recent first)
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      totalUsers,
      activeUsers,
      totalVideos,
      totalNotes,
      totalFavorites,
      recentActivity: recentActivity.slice(0, 10) // Limit to 10 most recent activities
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// Get all users (admin only)
router.get('/users', getCurrentUser, requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-accessToken -refreshToken').sort({ lastLogin: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get currently active users (admin only)
router.get('/users/active', getCurrentUser, requireAuth, requireAdmin, async (req, res) => {
  try {
    // Get users who have logged in within the last 5 minutes (currently active) and not null
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await User.find({ 
      lastLogin: { $gte: fiveMinutesAgo, $ne: null } 
    }, '-accessToken -refreshToken').sort({ lastLogin: -1 });
    
    res.json(activeUsers);
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({ error: 'Failed to fetch active users' });
  }
});

// Get all videos (admin only)
router.get('/videos', getCurrentUser, requireAuth, requireAdmin, async (req, res) => {
  try {
    const videos = await Video.find({}).sort({ createdAt: -1 });
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', getCurrentUser, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if trying to delete an admin
    if (ADMIN_EMAILS.includes(user.email)) {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    // Delete user's videos
    await Video.deleteMany({ userId: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Delete video (admin only)
router.delete('/videos/:videoId', getCurrentUser, requireAuth, requireAdmin, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await Video.findByIdAndDelete(videoId);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// Get system health
router.get('/health', getCurrentUser, requireAuth, requireAdmin, async (req, res) => {
  try {
    const dbStatus = await User.countDocuments().then(() => 'healthy').catch(() => 'unhealthy');
    
    res.json({
      database: dbStatus,
      apiServer: 'healthy',
      storage: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({ error: 'Failed to check system health' });
  }
});

module.exports = router; 