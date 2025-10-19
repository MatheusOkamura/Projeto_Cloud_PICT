/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ibmec: {
          blue: {
            50: '#e6f0ff',
            100: '#b3d4ff',
            200: '#80b8ff',
            300: '#4d9cff',
            400: '#1a80ff',
            500: '#0066e6',
            600: '#004db3',
            700: '#003380',
            800: '#001a4d',
            900: '#00001a',
          },
          gold: {
            50: '#fff9e6',
            100: '#ffecb3',
            200: '#ffe080',
            300: '#ffd34d',
            400: '#ffc61a',
            500: '#e6b000',
            600: '#b38900',
            700: '#806200',
            800: '#4d3b00',
            900: '#1a1400',
          },
        },
      },
    },
  },
  plugins: [],
}
