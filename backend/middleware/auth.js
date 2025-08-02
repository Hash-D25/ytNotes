const User = require('../models/User');
const { verifyToken, extractTokenFromHeader } = require('../utils/jwtUtils');

// Middleware to get current user from JWT token
const getCurrentUser = async (req, res, next) => {
  try {
    console.log('🔍 getCurrentUser middleware called');
    
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      console.log('❌ No JWT token found in Authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Verify the token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('❌ Invalid or expired JWT token');
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Set current user in request
    req.currentUser = user;
    console.log('✅ User authenticated via JWT:', user.email);
    next();
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