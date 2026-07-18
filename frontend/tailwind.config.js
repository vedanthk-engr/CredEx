/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // True black palette
        primary: {
          DEFAULT: '#000000', // pure black
          light: '#0f0f0f',   // near-black panels
          dark: '#000000',    // absolute black
        },
        // Glowing white as the accent
        accent: {
          DEFAULT: '#ffffff', // pure white
          light: '#f0f0f0',   // soft white hover
          dark: '#a3a3a3',    // grey accent-dark
        },
        // Semantic states — all in grey spectrum
        warning: {
          DEFAULT: '#737373', // neutral grey
          light: '#a3a3a3',
          dark: '#404040',
        },
        danger: {
          DEFAULT: '#404040', // dark charcoal
          light: '#737373',   // mid grey
          dark: '#1a1a1a',
        },
        purple: {
          DEFAULT: '#525252', // medium grey
          light: '#d4d4d4',   // light grey
          dark: '#262626',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'textGlow 3s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(255,255,255,0.08)',
        'glow':    '0 0 24px rgba(255,255,255,0.12)',
        'glow-lg': '0 0 48px rgba(255,255,255,0.18)',
      },
    },
  },
  plugins: [],
}
