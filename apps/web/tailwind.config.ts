import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        clay: '#f4ede4',
        ember: '#dc5d2a',
        moss: '#315845',
        sand: '#f6c56f',
      },
      boxShadow: {
        panel: '0 20px 60px rgba(15, 23, 42, 0.12)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Segoe UI', 'sans-serif'],
        body: ['Manrope', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
