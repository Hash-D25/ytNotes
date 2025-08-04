# YouTube Notes Dashboard

A React-based dashboard for managing YouTube video notes with timestamp functionality and keyboard shortcuts.

## Features

### Video Playback & Timestamp Functionality

1. **NotesList Page**: 
   - Click on any timestamp to start playing the video from that exact moment
   - Video plays directly on the page without redirecting to YouTube
   - YouTube icon next to each timestamp for direct YouTube navigation

2. **Favorites Page & All Notes Page**:
   - Click on timestamps to navigate to the NotesList page and automatically play from that timestamp
   - YouTube icon for direct YouTube navigation at specific timestamps

3. **YouTube Integration**:
   - External link icon next to each timestamp
   - Opens YouTube in a new tab at the exact timestamp
   - Seamless integration with YouTube's timestamp feature

### Keyboard Shortcuts

Full YouTube-style keyboard shortcuts are supported:

- **Space**: Play/Pause (disabled when typing in input fields)
- **← →**: Seek backward/forward 10 seconds (disabled when typing)
- **↑ ↓**: Volume up/down 10%
- **Shift + < >**: Decrease/Increase playback speed
- **F**: Toggle fullscreen
- **M**: Toggle mute
- **C**: Toggle captions
- **B**: Add bookmark at current timestamp
- **0-9**: Jump to 0%-90% (disabled when typing)
- **?**: Show/hide keyboard shortcuts help
- **Esc**: Hide shortcuts help

### Enhanced Timestamp Input

- **New Format**: Support for `mm:ss` and `h:mm:ss` formats
- **User-Friendly**: No need to calculate seconds manually
- **Flexible**: Accepts both 2-part (mm:ss) and 3-part (h:mm:ss) formats
- **Validation**: Automatic validation and error messages

### Smart Input Handling

- **Space Bar**: Works normally in input fields, only controls video when not typing
- **Arrow Keys**: Disabled in input fields to allow normal text navigation
- **Number Keys**: Disabled in input fields to allow normal number input
- **Special Keys**: M, C, B, ?, Esc still work in input fields for quick access

### Core Features

- **Note Management**: Add, edit, delete, and favorite notes
- **Video Organization**: Organize notes by video with thumbnails
- **Search & Sort**: Search through notes and videos, sort by various criteria
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Changes sync across all pages
- **Playback Speed Display**: Shows current playback speed
- **Blur Background Modal**: Modern UI with backdrop blur effect

## Technical Implementation

### Video Player
- Uses YouTube iframe API for enhanced control
- Fallback to standard iframe for compatibility
- Automatic timestamp seeking when navigating from other pages
- Error handling for API failures
- Full keyboard shortcut support with smart input handling
- Playback speed control with visual feedback

### Navigation
- URL parameters for timestamp navigation (`/notes/{videoId}?t={timestamp}`)
- Automatic video seeking when page loads with timestamp parameter
- Smooth navigation between pages

### Timestamp Handling
- Flexible input format support (mm:ss, h:mm:ss)
- Automatic conversion to seconds for storage
- Validation and error handling
- User-friendly display format

### Smart Keyboard Handling
- Detects when user is typing in input fields
- Disables video controls when typing to prevent conflicts
- Allows special shortcuts (M, C, B, ?, Esc) to work anywhere
- Maintains normal text input functionality

### Components
- `NotesPage`: Main video player and notes interface with enhanced keyboard shortcuts
- `NotesList`: List of notes with enhanced timestamp input
- `NoteCard`: Individual note display with clickable timestamps
- `FavoritesPage`: Favorite videos and notes with navigation
- `AllNotesPage`: All notes with navigation to specific timestamps

## Usage

1. **Adding Notes**: Enter timestamp in `mm:ss` or `h:mm:ss` format and note text
2. **Playing from Timestamp**: Click on any timestamp to play video from that moment
3. **Keyboard Controls**: Use YouTube-style keyboard shortcuts for video control
4. **Speed Control**: Use Shift + < > to control playback speed
5. **Quick Bookmarks**: Press B to add a bookmark at the current timestamp
6. **Captions**: Press C to toggle video captions
7. **YouTube Navigation**: Click the external link icon to open YouTube at that timestamp
8. **Navigation**: Use timestamps on Favorites/All Notes pages to jump to specific moments

## Keyboard Shortcuts Reference

| Key | Action | Notes |
|-----|--------|-------|
| Space | Play/Pause | Disabled in input fields |
| ← → | Seek ±10s | Disabled in input fields |
| ↑ ↓ | Volume ±10% | Always active |
| Shift + < > | Speed Control | Always active |
| F | Toggle Fullscreen | Always active |
| M | Toggle Mute | Always active |
| C | Toggle Captions | Always active |
| B | Add Bookmark | Always active |
| 0-9 | Jump to 0%-90% | Disabled in input fields |
| ? | Show/Hide Help | Always active |
| Esc | Hide Help | Always active |

## Development

```bash
cd dashboard
npm install
npm run dev
```

The application will be available at `https://ytnotes.netlify.app`

