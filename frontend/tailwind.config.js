/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      colors: {
        library: {
          green:  '#3B6D11',
          red:    '#A32D2D',
          amber:  '#854F0B',
          teal:   '#0F6E56',
          blue:   '#185FA5',
        },
      },
    },
  },
  plugins: [],
};
