/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Bone-white canvas
        bone: {
          DEFAULT: '#F7F5F0',
          light: '#FBFAF7',
          dark: '#EFECE3',
        },
        // Deep bottle-green — primary brand
        brand: {
          50: '#EEF4F1',
          100: '#D8E5DF',
          200: '#B3CCBF',
          300: '#8AB09B',
          400: '#5C8A76',
          500: '#3A6653',
          600: '#1E3B32',
          700: '#19322B',
          800: '#142A24',
          900: '#0E1F1A',
        },
        // Warm brass / gold — accent
        brass: {
          50: '#FBF7EE',
          100: '#F5EBD7',
          200: '#EAD9B4',
          300: '#DDC293',
          400: '#D3B379',
          500: '#C9A66B',
          600: '#B08C4F',
          700: '#8F6F3D',
          800: '#6E562F',
          900: '#574429',
        },
        // Soft clay — sales / low stock
        clay: {
          50: '#FBF1EE',
          100: '#F5DCD5',
          200: '#EABBAE',
          300: '#DD9483',
          400: '#C96A52',
          500: '#B5533C',
          600: '#9A4430',
          700: '#7D3626',
          800: '#632B1F',
          900: '#4E221A',
        },
        // Charcoal ink
        ink: {
          DEFAULT: '#22221F',
          light: '#5E5B54',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.25rem' }], // 12
        sm: ['0.875rem', { lineHeight: '1.375rem' }], // 14
        base: ['1rem', { lineHeight: '1.5rem' }], // 16
        lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18
        xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20
        '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24
        '3xl': ['1.75rem', { lineHeight: '2.25rem' }], // 28
        '4xl': ['2.5rem', { lineHeight: '1.15' }], // 40
        '5xl': ['3.5rem', { lineHeight: '1.08' }], // 56
      },
      letterSpacing: {
        tag: '0.08em',
        overline: '0.18em',
      },
      boxShadow: {
        tag: '0 1px 2px rgba(34, 34, 31, 0.08)',
        card: '0 1px 2px rgba(34, 34, 31, 0.04), 0 8px 24px rgba(34, 34, 31, 0.06)',
        drawer: '-12px 0 40px rgba(34, 34, 31, 0.18)',
      },
      maxWidth: {
        page: '80rem',
      },
    },
  },
  plugins: [],
};
