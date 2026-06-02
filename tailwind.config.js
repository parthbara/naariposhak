/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#fbf1f3',
          100: '#f5dfe4',
          500: '#a51f35',
          700: '#8A1C2A',
          800: '#6f1724',
          900: '#4f111b',
        },
        cream: '#FFF8EE',
        porcelain: '#FAF7F2',
        ink: '#202124',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 60px rgba(79, 17, 27, 0.12)',
        admin: '0 1px 2px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
