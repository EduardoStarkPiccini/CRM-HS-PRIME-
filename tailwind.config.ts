import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#141414',
        'surface-2': '#1c1c1c',
        border: '#2a2a2a',
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E9CD6B',
          dark: '#9C7A1E',
        },
        ink: {
          DEFAULT: '#F2EFE9',
          dim: '#A8A29A',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(212,175,55,0.25), 0 8px 24px rgba(212,175,55,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
