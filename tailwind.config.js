/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a5b8fc',
          400: '#8192f8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        surface: {
          DEFAULT: '#0f0f13',
          50:  '#1a1a24',
          100: '#16161f',
          200: '#12121a',
          300: '#0e0e15',
        },
        accent: {
          pink:   '#f472b6',
          purple: '#a78bfa',
          cyan:   '#22d3ee',
          amber:  '#fbbf24',
          green:  '#34d399',
        }
      },
      fontFamily: {
        display: ['Cabinet Grotesk', 'Syne', 'sans-serif'],
        body:    ['Satoshi', 'DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':    'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s infinite',
        'bounce-soft': 'bounceSoft 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:    { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight: { from: { opacity: 0, transform: 'translateX(-20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn:    { from: { opacity: 0, transform: 'scale(0.9)' }, to: { opacity: 1, transform: 'scale(1)' } },
        pulseGlow:  { '0%,100%': { boxShadow: '0 0 20px rgba(99,102,241,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(99,102,241,0.6)' } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        bounceSoft: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)' } },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6366f1, #a78bfa, #f472b6)',
        'gradient-dark':  'linear-gradient(180deg, #0f0f13 0%, #12121a 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'glow':       '0 0 30px rgba(99,102,241,0.25)',
        'glow-pink':  '0 0 30px rgba(244,114,182,0.25)',
        'glow-cyan':  '0 0 30px rgba(34,211,238,0.25)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
