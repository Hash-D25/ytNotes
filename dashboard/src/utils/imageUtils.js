// Shared utility for handling image URLs
export const getImageUrl = (path) => {
  if (!path) return null;
  
  if (path.startsWith('http')) {
    // Handle Google Drive URLs
    if (path.includes('drive.google.com')) {
      // Convert view URLs to direct content URLs if needed
      let processedUrl = path;
      if (path.includes('/view?usp=drivesdk')) {
        // Extract file ID and convert to direct content URL
        const fileIdMatch = path.match(/\/file\/d\/([^\/]+)/);
        if (fileIdMatch) {
          const fileId = fileIdMatch[1];
          processedUrl = `https://drive.google.com/uc?id=${fileId}`;
        }
      }
      
      const proxyUrl = `https://ytnotes-server.onrender.com/proxy-image?url=${encodeURIComponent(processedUrl)}`;
      return proxyUrl;
    }
    // Handle other HTTP URLs
    return path;
  }
  
  // Handle local paths
  return `https://ytnotes-server.onrender.com${path}`;
};

// Helper function to check if an image is from Google Drive
export const isGoogleDriveImage = (path) => {
  return path && path.includes('drive.google.com');
}; 

export const convertViewUrlToDirectUrl = (viewUrl) => {
  if (!viewUrl) return null;
  
  // Remove any query parameters and get the base URL
  const url = new URL(viewUrl);
  const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
  
  // Convert to direct URL format
  const processedUrl = baseUrl.replace('/view', '/uc');
  
  // Create proxy URL
  const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(processedUrl)}`;
  
  return proxyUrl;
}; 