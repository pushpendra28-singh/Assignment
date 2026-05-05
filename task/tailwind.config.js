/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        base: '#0a0a0f',
        surface: '#111118',
        elevated: '#18181f',
        overlay: '#1e1e28',
        hover: '#24242f',
        accent: {
          DEFAULT: '#7c6af7',
          bright: '#9585ff',
          dim: 'rgba(124,106,247,0.15)',
          glow: 'rgba(124,106,247,0.3)',
        },
        emerald: { DEFAULT: '#10d9a0', dim: 'rgba(16,217,160,0.12)' },
        amber: { DEFAULT: '#f59e0b', dim: 'rgba(245,158,11,0.12)' },
        rose: { DEFAULT: '#f43f5e', dim: 'rgba(244,63,94,0.12)' },
        sky: { DEFAULT: '#38bdf8', dim: 'rgba(56,189,248,0.12)' },
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          subtle: 'rgba(255,255,255,0.04)',
          strong: 'rgba(255,255,255,0.12)',
        },
        text: {
          primary: '#f1f0f9',
          secondary: '#9d9cb5',
          muted: '#5c5b72',
          disabled: '#3a3950',
        },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.4)',
        DEFAULT: '0 4px 16px rgba(0,0,0,0.5)',
        lg: '0 12px 40px rgba(0,0,0,0.6)',
        accent: '0 0 40px rgba(124,106,247,0.15)',
        'accent-glow': '0 0 20px rgba(124,106,247,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease',
        'slide-up': 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'spin-fast': 'spin 0.7s linear infinite',
        shimmer: 'shimmer 1.5s infinite',
        pulse: 'pulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },
  plugins: [],
};