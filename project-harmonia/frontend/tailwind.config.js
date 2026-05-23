/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cp8-dark': '#0a0a0f',
        'cp8-panel': '#12121a',
        'cp8-accent': '#ff4d4d',
        'cp8-glow': '#ff6b6b',
        'cp8-text': '#e8e8e8',
        'cp8-muted': '#6b6b7b',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
