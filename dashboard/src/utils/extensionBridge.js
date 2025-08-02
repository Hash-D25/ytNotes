// Extension Bridge for Dashboard-Extension Communication
// This file handles communication between the dashboard and Chrome extension

const extensionBridge = {
  // Initialize the bridge
  init() {
    console.log('🔧 Extension bridge initialized');
  },

  // Send tokens to extension
  sendTokensToExtension(accessToken, refreshToken) {
    try {
      // Store tokens in localStorage for extension to access
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      console.log('✅ Tokens sent to extension via localStorage');
    } catch (error) {
      console.error('❌ Error sending tokens to extension:', error);
    }
  },

  // Get tokens from localStorage (for extension access)
  getTokens() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('❌ Error getting tokens:', error);
      return { accessToken: null, refreshToken: null };
    }
  },

  // Clear tokens
  clearTokens() {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      console.log('✅ Tokens cleared from localStorage');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  }
};

export default extensionBridge; 