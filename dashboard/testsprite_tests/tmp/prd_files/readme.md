# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



{
  "type": "frontend",
  "tech": "React + Tailwind CSS + DaisyUI",
  "theme": "dark with neon teal contrast",
  "goal": "Build a fully polished dashboard UI for my YouTube Bookmark Notes project",
  "design": {
    "navbar": {
      "title": "📘 ytNotes",
      "items": ["Dashboard", "About", "Contact"],
      "rightIcons": ["🔍", "🌗 theme toggle", "👤 profile"]
    },
    "page": {
      "layout": "responsive grid/flex",
      "background": "dark gray/black",
      "accent": "neon teal (#00F5D4)",
      "font": "modern rounded (e.g. Inter, Poppins)",
      "card": {
        "style": "glass effect",
        "animation": "fade-in or slide-up",
        "elements": ["video title", "date", "bookmarks"],
        "bookmarkItem": {
          "timestamp": "formatted as mm:ss",
          "note": "styled block with icon"
        }
      }
    },
    "effects": {
      "hover": "soft glow with neon border",
      "buttons": "daisyui buttons with icon support",
      "animations": "fade, slide, pulse on hover",
      "icons": "Fetch modern icons using HeroIcons or Lucide"
    },
    "extras": {
      "images": "Optional Unsplash background/banner if needed",
      "themeToggle": "Add DaisyUI theme switcher (dark <-> light)",
      "footer": "Minimal footer with social links"
    }
  },
  "data": {
    "source": "GET http://localhost:5000/videos",
    "structure": [
      {
        "id": "string",
        "videoTitle": "string",
        "created_at": "ISO timestamp",
        "notes": [
          {
            "timestamp": "number (seconds)",
            "note": "string"
          }
        ]
      }
    ]
  },
  "requirements": [
    "Use DaisyUI components like card, navbar, badge, theme toggle",
    "Animate bookmark cards using framer-motion or Tailwind transitions",
    "Convert timestamps to mm:ss format in UI",
    "Make layout mobile-friendly (responsive)",
    "Highlight new notes with animation (pulse or glow)",
    "Sort videos by creation date (newest first)"
  ]
}

