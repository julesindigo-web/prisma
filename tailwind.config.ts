import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        graphite: '#101418',
        porcelain: '#F7F5F2',
        brass: '#C8A24B',
        mineral: '#1F6F54',
        signal: '#D64545',
        amber: '#FFA726'
      },
      fontFamily: {
        sans: ['Inter', 'Sora', 'system-ui', 'sans-serif'],
        signature: ['"Cormorant Garamond"', '"Fraunces"', 'serif']
      },
      borderRadius: {
        prisma: '12px'
      },
      spacing: {
        grid: '8px'
      }
    }
  },
  plugins: []
};

export default config;
