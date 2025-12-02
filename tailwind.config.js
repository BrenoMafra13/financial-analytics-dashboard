import defaultTheme from 'tailwindcss/defaultTheme'

const brand = {
  50: '#c1ff72',
  100: '#c1ff72',
  200: '#c1ff72',
  300: '#c1ff72',
  400: '#c1ff72',
  500: '#c1ff72',
  600: '#c1ff72',
  700: '#c1ff72',
  800: '#c1ff72',
  900: '#c1ff72',
}

const accent = {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
}

const surface = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5f5',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#111827',
  950: '#050b16',
}

const status = {
  success: '#c1ff72',
  warning: '#facc15',
  danger: '#fb7185',
  info: '#38bdf8',
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        brand,
        accent,
        surface,
        success: status.success,
        warning: status.warning,
        danger: status.danger,
        info: status.info,
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.5rem',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      boxShadow: {
        card: '0 30px 60px rgba(2, 6, 23, 0.45)',
        glow: '0 25px 60px rgba(193, 255, 114, 0.35)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(120deg, #c1ff72 0%, #c1ff72 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
