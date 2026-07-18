/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A1628', // Navy main
          light: '#132238',
          dark: '#050B14',
        },
        accent: {
          DEFAULT: '#1D9E75', // Teal success
          light: '#28be8e',
          dark: '#147656',
        },
        warning: {
          DEFAULT: '#BA7517', // Amber warning/medium risk
          light: '#dd8b1b',
          dark: '#935c10',
        },
        danger: {
          DEFAULT: '#D85A30', // Coral danger/high risk
          light: '#e8744c',
          dark: '#ac421d',
        },
        purple: {
          DEFAULT: '#534AB7', // Purple cohort/ZK proof
          light: '#6c62d6',
          dark: '#3e3692',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
