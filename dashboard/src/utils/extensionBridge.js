// Extension bridge for communication between dashboard and Chrome extension
export const extensionBridge = {
  // Initialize the bridge
  init() {
    // Bridge is ready
  },

  // Send tokens to extension via localStorage
  sendTokensToExtension(accessToken, refreshToken) {
    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      // Tokens sent to extension via localStorage
    }
  },

  // Clear tokens from extension
  clearTokensFromExtension() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // Tokens cleared from localStorage
  }
}; 