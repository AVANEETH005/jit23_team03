/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4f7fb',
          100: '#e8eff7',
          200: '#cbdbe9',
          300: '#9dbcd7',
          400: '#6898c0',
          500: '#457ba7',
          600: '#34618c',
          700: '#2b4f71',
          800: '#27445f',
          900: '#243b51',
          950: '#182737',
        },
        slate: {
          850: '#1a2235',
          950: '#0b0f19',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.04)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'premium': '0 10px 30px -10px rgba(0,0,0,0.1)'
      }
    },
  },
  plugins: [],
}
