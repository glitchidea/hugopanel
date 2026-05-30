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
        // Brand colors
        brand: {
          50: 'hsl(220, 100%, 97%)',
          100: 'hsl(220, 95%, 93%)',
          200: 'hsl(220, 90%, 85%)',
          300: 'hsl(220, 85%, 74%)',
          400: 'hsl(220, 80%, 62%)',
          500: 'hsl(220, 75%, 52%)',
          600: 'hsl(220, 72%, 44%)',
          700: 'hsl(220, 70%, 36%)',
          800: 'hsl(220, 68%, 28%)',
          900: 'hsl(220, 65%, 20%)',
        },
        // Dark surface tokens
        surface: {
          50: 'hsl(220, 20%, 98%)',
          100: 'hsl(222, 20%, 95%)',
          200: 'hsl(224, 18%, 90%)',
          800: 'hsl(222, 20%, 12%)',
          850: 'hsl(222, 22%, 10%)',
          900: 'hsl(224, 24%, 8%)',
          950: 'hsl(226, 26%, 6%)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px -5px hsl(220, 75%, 52%, 0.4)',
        'glow-sm': '0 0 10px -3px hsl(220, 75%, 52%, 0.3)',
      },
    },
  },
  plugins: [],
}
