/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bank-grade professional palette
        navy: {
          50: '#f4f6f8',
          100: '#e8ecf1',
          200: '#d1d9e3',
          300: '#adb9ca',
          400: '#8394ac',
          500: '#657691',
          600: '#4f5d76',
          700: '#424d61',
          800: '#394252',
          900: '#1a2332', // Primary Navy
        },
        gold: {
          50: '#fdfbf7',
          100: '#faf5ea',
          200: '#f4e9cc',
          300: '#ead8a3',
          400: '#dfc177',
          500: '#d4af37', // Primary Gold
          600: '#c09525',
          700: '#a07820',
          800: '#826020',
          900: '#6b501e',
        },
        forest: {
          50: '#f3f7f4',
          100: '#e1ebe3',
          200: '#c4d8c8',
          300: '#9bbfa2',
          400: '#6d9f78',
          500: '#4d8259',
          600: '#3a6746',
          700: '#2d5a3d', // Success Green
          800: '#254731',
          900: '#1f3a29',
        },
        cream: {
          50: '#ffffff',
          100: '#faf9f6', // Primary Background
          200: '#f5f3ed',
          300: '#ebe8dd',
          400: '#dcd7c7',
          500: '#ccc5b1',
        },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-crimson)', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': 'linear-gradient(135deg, var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'elegant': '0 4px 20px rgba(26, 35, 50, 0.08)',
        'elegant-lg': '0 10px 40px rgba(26, 35, 50, 0.12)',
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.3)',
      },
    },
  },
  plugins: [],
}
