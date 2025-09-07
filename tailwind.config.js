/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Odoo-inspired color palette
        primary: {
          50: '#faf5f9',
          100: '#f5ebf3',
          200: '#e8d4e4',
          300: '#d4adc8',
          400: '#b97ea2',
          500: '#875A7B', // Main Odoo purple
          600: '#714b65',
          700: '#5a3c50',
          800: '#4a3242',
          900: '#3f2a37',
        },
        secondary: {
          50: '#e6faf5',
          100: '#ccf5eb',
          200: '#99ebd7',
          300: '#66e1c3',
          400: '#44C7A1', // Odoo green
          500: '#39a888',
          600: '#2e8a6f',
          700: '#246b56',
          800: '#1d5644',
          900: '#174138',
        },
        gray: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#F2F2F2', // Light gray from Odoo
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        dark: {
          bg: '#1a1a1a',
          surface: '#2d2d2d',
          elevated: '#3a3a3a',
          text: '#f5f5f5',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient': 'gradient 15s ease infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 rgba(14, 165, 233, 0.7)',
            transform: 'scale(1)',
          },
          '50%': { 
            boxShadow: '0 0 0 10px rgba(14, 165, 233, 0)',
            transform: 'scale(1.05)',
          },
        },
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(20px)',
      },
      fontFamily: {
        'sans': ['Noto Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'display': ['Noto Sans', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': `
          linear-gradient(to right, #667eea 0%, #764ba2 25%, #f093fb 50%, #faa5e5 75%, #fed6e3 100%),
          linear-gradient(to bottom, #667eea 0%, #764ba2 25%, #f093fb 50%, #faa5e5 75%, #fed6e3 100%)
        `,
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
