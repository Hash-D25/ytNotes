module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'youtube-red': '#FF0000',
        'youtube-dark': '#0F0F0F',
        'youtube-gray': '#272727',
        'youtube-light-gray': '#AAAAAA',
        'youtube-hover': '#383838',
        'youtube-text': '#FFFFFF',
        'youtube-text-secondary': '#AAAAAA',
        'youtube-border': '#383838',
        'youtube-card': '#272727',
        'youtube-card-hover': '#383838',
      },
      fontFamily: {
        'youtube': ['Roboto', 'Arial', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'youtube': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'youtube-hover': '0 4px 8px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}; 