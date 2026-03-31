/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(142, 72%, 29%)',
          light: 'hsl(142, 72%, 94%)',
          dark: 'hsl(142, 72%, 20%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        secondary: {
          DEFAULT: 'hsl(158, 64%, 24%)',
          light: 'hsl(158, 64%, 92%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        border: 'hsl(140, 12%, 88%)',
        input: 'hsl(140, 12%, 88%)',
        ring: 'hsl(142, 72%, 29%)',
        background: 'hsl(138, 20%, 97%)',
        foreground: 'hsl(140, 15%, 12%)',
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)',
          foreground: 'hsl(140, 15%, 12%)',
        },
        muted: {
          DEFAULT: 'hsl(138, 12%, 94%)',
          foreground: 'hsl(140, 10%, 48%)',
        },
        destructive: {
          DEFAULT: 'hsl(0, 72%, 51%)',
          light: 'hsl(0, 72%, 96%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        warning: {
          DEFAULT: 'hsl(38, 92%, 50%)',
          light: 'hsl(38, 92%, 95%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
        success: {
          DEFAULT: 'hsl(142, 72%, 29%)',
          light: 'hsl(142, 72%, 94%)',
          foreground: 'hsl(0, 0%, 100%)',
        },
      },
      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px 0 rgba(22,101,52,0.12), 0 2px 6px -1px rgba(22,101,52,0.08)',
        'green': '0 4px 14px 0 rgba(22,101,52,0.18)',
        'green-sm': '0 2px 8px 0 rgba(22,101,52,0.14)',
        modal: '0 20px 60px -10px rgba(0,0,0,0.15)',
        dropdown: '0 8px 24px -4px rgba(0,0,0,0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};