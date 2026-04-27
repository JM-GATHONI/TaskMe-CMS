/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './context/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './types/**/*.{ts,tsx}',
  ],
  safelist: [
    { pattern: /^(bg|text|border|ring)-(primary|secondary)(-(dark|light|DEFAULT))?$/ },
    { pattern: /^(bg|text|border)-(red|green|blue|yellow|orange|purple|gray)-(100|200|300|400|500|600|700|800|900)$/ },
    { pattern: /^(bg|text|border)-(red|green|blue|yellow|orange|purple|gray)-(100|200|300|400|500|600|700|800|900)\/(10|20|30|40|50|60|70|80|90)$/ },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9D1F15',
          dark: '#7A1810',
          light: '#C43E32',
        },
        secondary: {
          DEFAULT: '#F39C2A',
          dark: '#D6861E',
        },
        'light-bg': '#F8F9FA',
      },
      zIndex: {
        header: '50',
        sidebar: '40',
        modal: '100',
      },
    },
  },
  plugins: [],
};
