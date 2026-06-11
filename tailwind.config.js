/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta inspirada no escudo da CBF
        primary: '#facb03', // Amarelo/ouro — CTAs e destaques (texto sempre azul-marinho)
        'primary-light': '#ffdb4d',
        'primary-dark': '#d9ad00',
        secondary: '#0762e4', // Azul — navbar, cabeçalhos, links (texto branco)
        'secondary-light': '#3d85f0',
        'secondary-dark': '#0b2472',
        accent: '#4d9250', // Verde — sucesso, status positivo, destaques secundários
        'accent-dark': '#3d7540',
        darkblue: '#0b2472', // Azul-marinho — textos e ícones de alto contraste
        dark: '#0b2472', // Texto principal (= azul-marinho)
        neutral: '#edf2f9', // Branco off-white
        light: '#edf2f9', // Background (= neutral)
        danger: '#E53E3E', // Vermelho — alertas e cartões vermelhos
        warning: '#FFD700', // Amarelo — cartões amarelos
      },
      fontFamily: {
        sans: ['Lato', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Oswald', 'Lato', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-live': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'score-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.35)', color: '#FFD700' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out both',
        'pulse-live': 'pulse-live 1.4s ease-in-out infinite',
        'score-pop': 'score-pop 0.6s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
