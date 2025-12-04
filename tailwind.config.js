/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Wireframe color palette - Background
        'bg-primary': '#0A0E1A',     // Deep navy
        'bg-secondary': '#1A1F2E',   // Slate
        'bg-tertiary': '#141824',    // Darker slate

        // Navy scale (updated for wireframe)
        navy: {
          950: '#0A0E1A',  // Primary background
          900: '#141824',  // Secondary panels
          800: '#1A1F2E',  // Cards
          700: '#2C3444',  // Borders/surfaces
          600: '#3D4758',  // Lighter borders
        },

        // Wireframe accent colors
        cyan: {
          DEFAULT: '#00D9FF',  // Primary accent
          50: '#E0F9FF',
          100: '#B8F2FF',
          200: '#7AEBFF',
          300: '#3DE4FF',
          400: '#00D9FF',
          500: '#00C2E6',
          600: '#00A3C2',
          700: '#00849E',
          800: '#00657A',
          900: '#004656',
        },

        magenta: {
          DEFAULT: '#FF00AA',  // Secondary accent
          50: '#FFE6F5',
          100: '#FFCCEB',
          200: '#FF99D6',
          300: '#FF66C2',
          400: '#FF33AD',
          500: '#FF00AA',
          600: '#CC0088',
          700: '#990066',
          800: '#660044',
          900: '#330022',
        },

        // Legacy accent (for backwards compatibility)
        accent: {
          DEFAULT: '#00D9FF',
          50: '#E0F9FF',
          100: '#B8F2FF',
          200: '#7AEBFF',
          300: '#3DE4FF',
          400: '#00D9FF',
          500: '#00C2E6',
          600: '#00A3C2',
          700: '#00849E',
          800: '#00657A',
          900: '#004656',
        },

        // Status colors with wireframe palette
        success: '#10B981',  // Green
        warning: '#F59E0B',  // Amber
        danger: '#EF4444',   // Red
        error: '#EF4444',

        // Text colors
        'text-primary': '#E5E7EB',
        'text-secondary': '#9CA3AF',
        'text-tertiary': '#6B7280',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'tiny': ['10px', { lineHeight: '1.4', fontWeight: '700' }],
        'xs': ['12px', { lineHeight: '1.5' }],
        'sm': ['14px', { lineHeight: '1.5' }],
        'base': ['14px', { lineHeight: '1.5' }],
        'md': ['16px', { lineHeight: '1.5' }],
        'lg': ['20px', { lineHeight: '1.4' }],
        'xl': ['24px', { lineHeight: '1.3' }],
        '2xl': ['28px', { lineHeight: '1.2' }],
      },

      spacing: {
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },

      borderRadius: {
        'sm': '8px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },

      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.2)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(0, 217, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 217, 255, 0.4)',
        'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.3)',
        'glow-magenta': '0 0 20px rgba(255, 0, 170, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(0, 217, 255, 0.1)',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin 1.5s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },

      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.3', filter: 'blur(8px)' },
          '50%': { opacity: '0.6', filter: 'blur(12px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-cyan': 'linear-gradient(135deg, #00D9FF 0%, #00A3C2 100%)',
        'gradient-magenta': 'linear-gradient(135deg, #FF00AA 0%, #CC0088 100%)',
      },

      transitionDuration: {
        '400': '400ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
