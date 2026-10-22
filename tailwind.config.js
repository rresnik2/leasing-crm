/** @type {import('tailwindcss').Config} */

// Semantic color tokens are defined as RGB channels in src/index.css so
// Tailwind opacity modifiers keep working (e.g. bg-brand/10).
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: {
          DEFAULT: token('surface'),
          muted: token('surface-muted'),
        },
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        fg: {
          DEFAULT: token('fg'),
          muted: token('fg-muted'),
          subtle: token('fg-subtle'),
          inverse: token('fg-inverse'),
        },
        brand: {
          DEFAULT: token('brand'),
          hover: token('brand-hover'),
          subtle: token('brand-subtle'),
          strong: token('brand-strong'),
        },
        danger: {
          DEFAULT: token('danger'),
          hover: token('danger-hover'),
          subtle: token('danger-subtle'),
          strong: token('danger-strong'),
        },
        success: {
          DEFAULT: token('success'),
          subtle: token('success-subtle'),
          strong: token('success-strong'),
        },
        warning: {
          DEFAULT: token('warning'),
          subtle: token('warning-subtle'),
          strong: token('warning-strong'),
        },
        focus: token('focus'),
      },
      borderRadius: {
        control: '0.5rem',
        card: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.06), 0 1px 3px 0 rgb(15 23 42 / 0.08)',
        raised: '0 4px 6px -1px rgb(15 23 42 / 0.1), 0 2px 4px -2px rgb(15 23 42 / 0.08)',
        overlay: '0 20px 25px -5px rgb(15 23 42 / 0.15), 0 8px 10px -6px rgb(15 23 42 / 0.1)',
      },
      fontSize: {
        display: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700', letterSpacing: '-0.01em' }],
        heading: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        title: ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        body: ['0.875rem', { lineHeight: '1.25rem' }],
        label: ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        caption: ['0.75rem', { lineHeight: '1rem' }],
      },
      zIndex: {
        floating: '40',
        overlay: '50',
        toast: '60',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(0.5rem)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms cubic-bezier(0.2, 0, 0, 1)',
        'scale-in': 'scale-in 200ms cubic-bezier(0.2, 0, 0, 1)',
        'slide-up': 'slide-up 200ms cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
}
