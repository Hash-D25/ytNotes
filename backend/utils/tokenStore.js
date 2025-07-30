// Simple token store for cross-origin access
let globalTokens = null;

const setTokens = (tokens) => {
  globalTokens = tokens;
  console.log('🔐 Global tokens set:', tokens ? 'Yes' : 'No');
};

const getTokens = () => {
  return globalTokens;
};

const clearTokens = () => {
  globalTokens = null;
  console.log('🔐 Global tokens cleared');
};

module.exports = {
  setTokens,
  getTokens,
  clearTokens
}; 