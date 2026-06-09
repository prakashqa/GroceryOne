import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary palette (green theme — matches mobile themes.ts)
        primary: {
          DEFAULT: '#2E7D32',
          light: '#66BB6A',
          dark: '#1B5E20',
          muted: '#388E3C',
        },
        accent: '#FF6B35',
        // Status colors
        success: { DEFAULT: '#2E7D32', bg: '#E8F5E9' },
        warning: { DEFAULT: '#F57C00', bg: '#FFF3E0' },
        error: { DEFAULT: '#D32F2F', bg: '#FFEBEE' },
        info: { DEFAULT: '#1976D2', bg: '#E3F2FD' },
        // Surface colors — refined dark-mode palette for better depth + contrast.
        // Background is the deepest, surface is panels, card is elevated.
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1A1D21',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#22262B',
        },
        background: {
          DEFAULT: '#F6F8FA',
          dark: '#0E1014',
        },
        // Subtle borders that work in both themes.
        line: {
          DEFAULT: '#EAECEF',
          dark: '#2A2F36',
        },
        // In-cart states
        'in-cart': {
          bg: '#EDF7EE',
          border: '#81C784',
          badge: '#4CAF50',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'xxs': '0.625rem',  // 10px
      },
      spacing: {
        'xs': '0.25rem',   // 4px
        'smd': '0.75rem',  // 12px
      },
      borderRadius: {
        'xs': '0.25rem',   // 4px
        'smd': '0.75rem',  // 12px
      },
      // Custom shadows — soft, layered, and theme-aware (dark mode gets a
      // tinted ring instead of trying to render black-on-black shadow).
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
        // Soft, slightly more refined elevation for metric/stat tiles.
        stat: '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.04)',
        'card-lg': '0 4px 6px -1px rgba(16, 24, 40, 0.06), 0 8px 24px -4px rgba(16, 24, 40, 0.08)',
        'card-hover': '0 4px 12px -2px rgba(16, 24, 40, 0.08), 0 2px 4px -1px rgba(16, 24, 40, 0.04)',
        // Soft inner glow on focused inputs in dark mode.
        'focus-ring': '0 0 0 3px rgba(46, 125, 50, 0.18)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'fade-up': 'fadeUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
