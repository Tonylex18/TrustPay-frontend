/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
      './src/pages/**/*.{ts,tsx}',
      './src/components/**/*.{ts,tsx}',
      './src/app/**/*.{ts,tsx}',
      './src/**/*.{ts,tsx}',
    ],
    prefix: '',
    theme: {
      container: {
        center: true,
        padding: '2rem',
        screens: {
          '2xl': '1400px',
        },
      },
      extend: {
        colors: {
          border: 'var(--color-border)', /* slate-300 with opacity */
          input: 'var(--color-input)', /* slate-300 with opacity */
          ring: 'var(--color-ring)', /* blue-900 */
          background: 'var(--color-background)', /* gray-50 */
          foreground: 'var(--color-foreground)', /* gray-800 */
          primary: {
            DEFAULT: 'var(--color-primary)', /* blue-900 */
            foreground: 'var(--color-primary-foreground)', /* white */
          },
          secondary: {
            DEFAULT: 'var(--color-secondary)', /* slate-500 */
            foreground: 'var(--color-secondary-foreground)', /* white */
          },
          accent: {
            DEFAULT: 'var(--color-accent)', /* amber-500 */
            foreground: 'var(--color-accent-foreground)', /* gray-800 */
          },
          destructive: {
            DEFAULT: 'var(--color-destructive)', /* red-500 */
            foreground: 'var(--color-destructive-foreground)', /* white */
          },
          success: {
            DEFAULT: 'var(--color-success)', /* emerald-500 */
            foreground: 'var(--color-success-foreground)', /* white */
          },
          warning: {
            DEFAULT: 'var(--color-warning)', /* amber-500 */
            foreground: 'var(--color-warning-foreground)', /* gray-800 */
          },
          error: {
            DEFAULT: 'var(--color-error)', /* red-500 */
            foreground: 'var(--color-error-foreground)', /* white */
          },
          muted: {
            DEFAULT: 'var(--color-muted)', /* gray-100 */
            foreground: 'var(--color-muted-foreground)', /* gray-500 */
          },
          card: {
            DEFAULT: 'var(--color-card)', /* white */
            foreground: 'var(--color-card-foreground)', /* gray-800 */
          },
          popover: {
            DEFAULT: 'var(--color-popover)', /* white */
            foreground: 'var(--color-popover-foreground)', /* gray-800 */
          },
        },
        borderRadius: {
          lg: 'var(--radius)',
          md: 'calc(var(--radius) - 2px)',
          sm: 'calc(var(--radius) - 4px)',
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          data: ['JetBrains Mono', 'monospace'],
        },
        fontSize: {
          'nav': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
          'nav-lg': ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }],
        },
        boxShadow: {
          'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
          'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
          'modal': '0 8px 25px rgba(0, 0, 0, 0.15)',
          'nav': '0 1px 3px rgba(0, 0, 0, 0.08)',
        },
        transitionDuration: {
          '200': '200ms',
          '300': '300ms',
        },
        transitionTimingFunction: {
          'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        },
        spacing: {
          'nav-height': '60px',
          'nav-margin': '16px',
        },
        zIndex: {
          'nav': '1000',
          'dropdown': '1100',
          'modal': '1200',
        },
        keyframes: {
          'fade-in': {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          'slide-in-right': {
            '0%': { transform: 'translateX(100%)' },
            '100%': { transform: 'translateX(0)' },
          },
          'slide-in-bottom': {
            '0%': { transform: 'translateY(100%)' },
            '100%': { transform: 'translateY(0)' },
          },
        },
        animation: {
          'fade-in': 'fade-in 0.2s ease-out',
          'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          'slide-in-bottom': 'slide-in-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    plugins: [require('tailwindcss-animate')],
  };