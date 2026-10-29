/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        main: '#0F172A',
        muted: '#64748B',
        border: '#E2E8F0',
        brand: {
          DEFAULT: '#0F766E',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        accent: {
          DEFAULT: '#14B8A6',
          hover: '#0D9488',
        },
        positive: {
          DEFAULT: '#16A34A',
          bg: '#DCFCE7',
          light: '#22C55E',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: '#FEF3C7',
          light: '#FBBF24',
        },
        danger: {
          DEFAULT: '#DC2626',
          bg: '#FEE2E2',
          light: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'card': '0 2px 6px -1px rgba(15, 23, 42, 0.04), 0 4px 10px -2px rgba(15, 23, 42, 0.03)',
        'float': '0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
}

