/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B35', // Naranja vibrante
          hover: '#E55A2A',
          light: '#FF855A',
        },
        secondary: {
          DEFAULT: '#004E89', // Azul profundo
          hover: '#003C6E',
          light: '#2A6FA3',
        },
        accent: {
          DEFAULT: '#F77F00', // Naranja cálido
          hover: '#DE7200',
        },
        success: {
          DEFAULT: '#06A77D',
          light: '#E6F6F2',
        },
        error: {
          DEFAULT: '#D62828',
          light: '#FBEAEA',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F5F5F5',
          200: '#E0E0E0',
          300: '#D1D5DB',
          400: '#9CA3AF', // ~#999999
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#333333', // Dark text
          900: '#111827',
        },
        background: '#FFFFFF',
        surface: '#F5F5F5',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
