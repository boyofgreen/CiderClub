/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Admin / legacy brand scale (amber-orange) — keep so admin UI doesn't break
        brand: {
          50:  '#fef9f0',
          100: '#fdefd6',
          200: '#fbd9a3',
          300: '#f9bc64',
          400: '#f59c2c',
          500: '#e8800d',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Public / saloon design tokens
        navy:       { DEFAULT: '#1a2540', deep: '#131c33', soft: '#2a3654' },
        gold:       { DEFAULT: '#c9a14a', bright: '#e7c87a', deep: '#9c7a2e' },
        cream:      { DEFAULT: '#f7f1e3', deep: '#efe6cf', paper: '#fbf6e9' },
        terracotta: { DEFAULT: '#b65a3c', deep: '#8a4128' },
        ink:        { DEFAULT: '#1d1a14', soft: '#4a4334' },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
