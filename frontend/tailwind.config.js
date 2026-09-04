/**
 * Centralized design tokens.
 *
 * Everything visual (colors, fonts, radii) is defined here and referenced
 * via CSS variables in index.css, so swapping to a future custom design
 * means editing THIS file (and the two font imports in index.html) —
 * not touching individual components.
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          light: 'var(--color-brand-light)',
          dark: 'var(--color-brand-dark)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
        ink: 'var(--color-ink)',
        surface: 'var(--color-surface)',
        'surface-muted': 'var(--color-surface-muted)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
      },
    },
  },
  plugins: [],
};
