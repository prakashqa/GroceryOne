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
        // Surface colors
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1E1E1E',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#2C2C2C',
        },
        background: {
          DEFAULT: '#F5F7FA',
          dark: '#0F0F0F',
        },
        // In-cart states
        'in-cart': {
          bg: '#EDF7EE',
          border: '#81C784',
          badge: '#4CAF50',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
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
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
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
      },
    },
  },
  plugins: [],
};

export default config;
