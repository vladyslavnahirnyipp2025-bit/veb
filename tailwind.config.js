/** Дизайн-система з Figma (ЛР №4) як тема Tailwind. Раніше ця конфігурація була inline-скриптом для CDN. */
module.exports = {
  content: ['./index.html', './assets/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2DD4BF',
          strong: '#0F766E',
          hover: '#5EEAD4',
          pressed: '#14B8A6'
        },
        accent: '#86EFAC',
        warning: '#FBBF24',
        ink: '#0B1220',
        card: '#142033',
        line: '#1E2D45'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 4px 16px rgba(0, 0, 0, 0.25)'
      }
    }
  },
  plugins: []
};
