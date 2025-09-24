/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Heartfelt DeFi Journey Color Palette
        primary: {
          50: '#fef7f7',
          100: '#fef2f2',
          200: '#fde8e8',
          300: '#fbd5d5',
          400: '#f8b4b4',
          500: '#FF6F61', // Coral
          600: '#f56565',
          700: '#e53e3e',
          800: '#c53030',
          900: '#9b2c2c',
          950: '#742a2a',
        },
        heartfelt: {
          'coral': '#FF6F61', // Main coral color
          'mint': '#A8E6CF', // Mint green
          'gold': '#FFD700', // Golden yellow
          'peach': '#FFAB91',
          'lavender': '#E1BEE7',
          'rose': '#F8BBD9',
          'cream': '#FFF5E6',
          'sage': '#B8E6B8',
          'soft-pink': '#FFE4E1',
          'warm-white': '#FEFEFE',
        },
        // Supporting colors for different states
        'mint': {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#A8E6CF', // Main mint
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        'coral': {
          50: '#fef7f7',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#FF6F61', // Main coral
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        gaming: ['Rajdhani', 'Orbitron', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        // Gaming-inspired animations
        'cyber-pulse': 'cyber-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'neon-glow': 'neon-glow 2s ease-in-out infinite alternate',
        'float-smooth': 'float-smooth 4s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-bottom': 'slide-in-bottom 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-up': 'scale-up 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow-ring': 'glow-ring 2s ease-in-out infinite',
        'text-shimmer': 'text-shimmer 2s ease-in-out infinite',
        'border-spin': 'border-spin 1s linear infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
      },
      keyframes: {
        'cyber-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1)'
          },
          '50%': {
            boxShadow: '0 0 40px rgba(0, 212, 255, 0.6), inset 0 0 30px rgba(0, 212, 255, 0.2)'
          },
        },
        'neon-glow': {
          '0%': {
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
            filter: 'brightness(1)'
          },
          '100%': {
            textShadow: '0 0 20px currentColor, 0 0 30px currentColor, 0 0 40px currentColor',
            filter: 'brightness(1.2)'
          },
        },
        'float-smooth': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(-5px) rotate(-1deg)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-bottom': {
          '0%': { transform: 'translateY(100px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-up': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'glow-ring': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(0, 212, 255, 0.7)'
          },
          '50%': {
            boxShadow: '0 0 0 20px rgba(0, 212, 255, 0)'
          },
        },
        'text-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        'border-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      backgroundImage: {
        // Gaming-style gradients
        'cyber-grid': `
          linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px),
          linear-gradient(rgba(0, 212, 255, 0.01) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 212, 255, 0.01) 1px, transparent 1px)
        `,
        'gaming-gradient': 'linear-gradient(135deg, #00d4ff 0%, #b142ff 50%, #ff4081 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(20, 20, 32, 0.9) 0%, rgba(26, 26, 48, 0.9) 100%)',
        'button-gradient': 'linear-gradient(135deg, #00d4ff 0%, #0080ff 100%)',
        'neon-gradient': 'linear-gradient(45deg, #39ff14, #00d4ff, #b142ff, #ff4081)',
        'dark-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #141420 100%)',
        'text-shimmer': 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.8) 50%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '100px 100px, 100px 100px, 20px 20px, 20px 20px',
        'shimmer': '200% 100%',
      },
      boxShadow: {
        // Gaming-style shadows
        'cyber': '0 0 20px rgba(0, 212, 255, 0.3), inset 0 0 20px rgba(0, 212, 255, 0.1)',
        'cyber-lg': '0 0 40px rgba(0, 212, 255, 0.4), inset 0 0 40px rgba(0, 212, 255, 0.1)',
        'neon-pink': '0 0 20px rgba(255, 64, 129, 0.5), 0 0 40px rgba(255, 64, 129, 0.3)',
        'neon-green': '0 0 20px rgba(57, 255, 20, 0.5), 0 0 40px rgba(57, 255, 20, 0.3)',
        'gaming-card': '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 212, 255, 0.1)',
        'gaming-button': '0 4px 20px rgba(0, 212, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'inner-glow': 'inset 0 0 20px rgba(0, 212, 255, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: [
      {
        wooswap: {
          "primary": "#FF6F61", // Coral
          "primary-focus": "#e53e3e",
          "primary-content": "#ffffff",
          "secondary": "#A8E6CF", // Mint
          "secondary-focus": "#10b981",
          "secondary-content": "#064e3b",
          "accent": "#FFD700", // Gold
          "accent-focus": "#d4af37",
          "accent-content": "#1a1a0a",
          "neutral": "#f8f9fa",
          "neutral-focus": "#e9ecef",
          "neutral-content": "#495057",
          "base-100": "#ffffff",
          "base-200": "#f8f9fa",
          "base-300": "#e9ecef",
          "base-content": "#495057",
          "info": "#FF6F61",
          "success": "#A8E6CF",
          "warning": "#FFD700",
          "error": "#dc3545",
        },
      },
      "cyberpunk"
    ],
  },
}