/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0b1020',
        panel: '#0f162c',
        ink: '#dff5ff',
        muted: '#9ec7d6',
        accent: '#7fe6c9',
        line: '#1f2b4a',
        good: '#7fffb0',
        warn: '#ffd66b',
        bad: '#ff8a8a',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
