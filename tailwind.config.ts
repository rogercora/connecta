import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta inspirada no HopeRise Charity Landing Page (Phenomenon Studio)
        // Cores quentes, orgânicas, acolhedoras e humanas
        cream: {
          50: '#FCFAF7',
          100: '#FAF7F2',
          200: '#F5EFE6',
          300: '#EFE7DA',
          400: '#E4D8C5',
          500: '#D5C4AB',
          600: '#B8A487',
        },
        terracotta: {
          50: '#FDF7F4',
          100: '#FAF0EA',
          200: '#F5DDD0',
          300: '#ECC3AC',
          400: '#DC9B75',
          500: '#C8622A', // Cor primária de calor e mobilização HopeRise
          600: '#B1521F',
          700: '#944116',
          800: '#793414',
          900: '#642D13',
        },
        sage: {
          50: '#F2F8F4',
          100: '#E4F2E8',
          200: '#CDE5D5',
          300: '#A7D1B4',
          400: '#6FAF81',
          500: '#2E7D47', // Verde natural orgânico
          600: '#236537',
          700: '#1C502C',
        },
        earth: {
          50: '#F9F8F6',
          100: '#F2EFEB',
          200: '#E5DFD7',
          300: '#D0C6B8',
          400: '#A09686',
          500: '#6E6659',
          600: '#4E483E',
          700: '#38342E',
          800: '#25221E',
          900: '#181614', // Carvão quente do HopeRise
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'hoperise-card': '0 8px 30px -4px rgba(40, 30, 20, 0.06), 0 2px 6px -1px rgba(40, 30, 20, 0.04)',
        'hoperise-hover': '0 20px 40px -10px rgba(40, 30, 20, 0.12), 0 6px 12px -2px rgba(40, 30, 20, 0.06)',
        'hoperise-btn': '0 4px 14px 0 rgba(200, 98, 42, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
