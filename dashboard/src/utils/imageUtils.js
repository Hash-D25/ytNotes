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
          console.log('🔍 Converting view URL to direct URL:', processedUrl);
        }
      }
      
      const proxyUrl = `http://localhost:5000/proxy-image?url=${encodeURIComponent(processedUrl)}`;
      console.log('🔍 Final proxy URL:', proxyUrl);
      return proxyUrl;
    }
    // Handle other HTTP URLs
    return path;
  }
  
  // Handle local paths
  return `http://localhost:5000${path}`;
};

// Helper function to check if an image is from Google Drive
export const isGoogleDriveImage = (path) => {
  return path && path.includes('drive.google.com');
}; 