# 🔖 YouTube Bookmark Notes Extension + Dashboard

A **Chrome Extension + Full-Stack Web App** that empowers users to save meaningful **timestamped notes** while watching YouTube videos. These notes are stored in a database, grouped by video, and displayed beautifully on a web dashboard built with **React** and **DaisyUI**.

Ideal for:
- Students learning from tutorials.
- Developers watching lectures or conference talks.
- Musicians marking moments in jam sessions.
- Anyone who consumes educational or long-form video content.

---

## 🎯 Project Goals

- Enable **in-context note-taking** directly on YouTube videos.
- Store these notes with **timestamps and metadata** in a centralized backend.
- Provide a clean and elegant **dashboard** to browse and manage saved bookmarks.

---

## 🌟 Features – Explained in Detail

### 🔌 1. Chrome Extension: Minimal YouTube Integration

#### 📍 Floating Bookmark Button
- When a user visits any YouTube video page (`https://www.youtube.com/watch?v=...`), the extension injects a **small floating `🔖` button** directly on the video player.
- This button is **non-intrusive**, positioned in a corner of the video area using CSS, and appears after a slight delay to ensure the YouTube DOM has loaded.

#### 🗒️ Bookmark Note Popup
- When the button is clicked, a **popup window opens** allowing the user to write a **brief note** about the current moment in the video.
- The note popup contains:
  - A simple `textarea` input.
  - A **“Save”** button to submit the note.

#### 🕒 Timestamp + Metadata Capture
- When the user clicks "Save":
  - The current **timestamp (in seconds)** of the YouTube video is extracted using Chrome scripting.
  - The **video title** and **YouTube video ID** are also captured.
  - The current **date and time** are generated for backend logging.

#### ☁️ Backend Save (via Fetch)
- A `POST` request is sent to the backend containing:
  - `videoId`, `videoTitle`
  - `timestamp` (seconds)
  - `note`
  - `createdAt` (generated on the server)

#### 🧠 Intelligent First-Time Logic
- If it's the **first bookmark** for a video, the backend will automatically create a **new video entry**.
- If the video already exists, it will simply **append the new note** to that video’s entry.

---

### 🌐 2. Web Dashboard: Full-Featured Notes Viewer

#### 📋 Grouped by Video
- All saved videos are **listed by title**, with each video showing:
  - The video’s title
  - Creation date
  - All associated **timestamped notes**

#### ⏱️ Timestamp Formatting
- Timestamps are displayed in readable **`MM:SS` format** for easy scanning.
- (Optional improvement: Make timestamps clickable to jump directly to YouTube.)

#### 💅 UI Design: Tailwind + DaisyUI
- The dashboard uses:
  - **Tailwind CSS** for utility-first design.
  - **DaisyUI** components for beautifully styled cards, buttons, and typography.

#### ⚡ Fast & Responsive
- The UI is optimized for **speed and clarity**, fetching data once from the backend and displaying instantly.
- It uses **Axios** for API requests.

---

## 🧪 Example API Behavior

### `POST /bookmark`
- Request Body:
```json
{
  "videoId": "zYp-g0R_dNU",
  "timestamp": 245,
  "note": "React useEffect hook explained with example",
  "videoTitle": "React Hooks Crash Course"
}



