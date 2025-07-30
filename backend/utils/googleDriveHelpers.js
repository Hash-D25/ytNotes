const { google } = require('googleapis');

// Helper function to get or create ytNotes folder
async function getOrCreateYtNotesFolder(drive) {
  const folderName = 'ytNotes';

  // 1. Check if folder exists
  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id; // folder already exists
  }

  // 2. Create folder
  const folder = await drive.files.create({
    resource: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });

  return folder.data.id;
}

// Helper function to get or create screenshots folder
async function getOrCreateScreenshotsFolder(drive, ytNotesFolderId) {
  const folderName = 'screenshots';

  // 1. Check if screenshots folder exists in ytNotes
  const res = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${ytNotesFolderId}' in parents and trashed=false`,
    fields: 'files(id, name)',
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id; // folder already exists
  }

  // 2. Create screenshots folder inside ytNotes
  const folder = await drive.files.create({
    resource: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [ytNotesFolderId],
    },
    fields: 'id',
  });

  return folder.data.id;
}

// Helper function to upload screenshot to Drive
async function uploadScreenshotToDrive(drive, folderId, base64Image, filename) {
  const buffer = Buffer.from(base64Image, 'base64');
  const { Readable } = require('stream');
  
  // Create a readable stream from the buffer
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  
  const fileMetadata = {
    name: filename,
    parents: [folderId],
  };
  
  const file = await drive.files.create({
    resource: fileMetadata,
    media: {
      mimeType: 'image/png',
      body: stream
    },
    fields: 'id',
  });
  
  return file.data.id;
}

// Helper function to make file public and get shareable link
async function makeFilePublicAndGetUrl(drive, fileId) {
  // Make file public
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });
  
  // Get shareable link
  const file = await drive.files.get({
    fileId: fileId,
    fields: 'webViewLink, webContentLink',
  });
  
  console.log('🔐 Google Drive file links:', {
    webViewLink: file.data.webViewLink,
    webContentLink: file.data.webContentLink
  });
  
  // Use webContentLink for direct image access
  const webContentUrl = file.data.webContentLink;
  console.log('🔐 Using webContentLink for image:', webContentUrl);
  return webContentUrl;
}

module.exports = {
  getOrCreateYtNotesFolder,
  getOrCreateScreenshotsFolder,
  uploadScreenshotToDrive,
  makeFilePublicAndGetUrl
}; 