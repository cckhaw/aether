/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'sans-serif',
        ],
      },
      colors: {
        // Theme-aware: values come from CSS variables set per [data-theme] in index.css.
        fg: 'rgb(var(--fg) / <alpha-value>)',
        on: '#FFFFFF', // text/borders that sit on accent fills; white in both themes
        aether: {
          cyan: 'rgb(var(--cyan) / <alpha-value>)',
          blue: '#007AFF',
          gold: 'rgb(var(--gold) / <alpha-value>)',
          ink: '#0B1020',
        },
        glass: {
          DEFAULT: 'var(--glass-bg)',
          strong: 'var(--glass-strong)',
          border: 'var(--glass-border)',
        },
      },
      borderRadius: {
        squircle: '24px',
      },
      backdropBlur: {
        glass: '24px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        cyan: '0 0 24px rgba(0, 245, 212, 0.55)',
        gold: '0 0 24px rgba(255, 215, 0, 0.55)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.6)', opacity: '0.9' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.2, 0.6, 0.3, 1) infinite',
        'sheet-up': 'sheetUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        floaty: 'floaty 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '.glass': {
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          border: '1px solid var(--glass-border)',
          borderRadius: '24px',
          boxShadow: 'var(--glass-shadow)',
        },
      });
    },
  ],
};
