const User = require('../models/User');
const { getTokens } = require('../utils/tokenStore');
const { google } = require('googleapis');

// Middleware to get current user
const getCurrentUser = async (req, res, next) => {
  try {
    console.log('🔍 getCurrentUser middleware called');
    console.log('🔍 Session userId:', req.session.userId);
    
    // Check if user is in session
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.currentUser = user;
        console.log('✅ User found in session:', user.email);
        return next();
      }
    }

    // Check if we have tokens and can get user info from Google
    let tokens = req.session.tokens;
    if (!tokens) {
      tokens = getTokens();
    }

    console.log('🔍 Tokens available:', tokens ? 'Yes' : 'No');

    if (tokens && tokens.access_token) {
      try {
        const oauth2Client = new google.auth.OAuth2();
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

        // Store user in session
        req.session.userId = user._id;
        req.currentUser = user;
        return next();
      } catch (error) {
        console.error('❌ Error getting user info:', error);
        return res.status(401).json({ error: 'Authentication failed' });
      }
    }

    console.log('❌ No tokens found - user not authenticated');
    return res.status(401).json({ error: 'Not authenticated' });
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  console.log('🔍 requireAuth middleware called');
  console.log('🔍 req.currentUser:', req.currentUser ? 'Present' : 'Missing');
  
  if (!req.currentUser) {
    console.log('❌ No current user found - authentication required');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  console.log('✅ Authentication passed for user:', req.currentUser.email);
  next();
};

module.exports = { getCurrentUser, requireAuth }; 