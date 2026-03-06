/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)', // black
        foreground: 'var(--color-foreground)', // white
        card: {
          DEFAULT: 'var(--color-card)', // neutral-950
          foreground: 'var(--color-card-foreground)', // white
        },
        popover: {
          DEFAULT: 'var(--color-popover)', // neutral-950
          foreground: 'var(--color-popover-foreground)', // white
        },
        primary: {
          DEFAULT: 'var(--color-primary)', // amber-500 gold
          foreground: 'var(--color-primary-foreground)', // black
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)', // custom rose
          foreground: 'var(--color-secondary-foreground)', // black
        },
        muted: {
          DEFAULT: 'var(--color-muted)', // neutral-800
          foreground: 'var(--color-muted-foreground)', // neutral-400
        },
        accent: {
          DEFAULT: 'var(--color-accent)', // emerald-500
          foreground: 'var(--color-accent-foreground)', // black
        },
        destructive: {
          DEFAULT: 'var(--color-destructive)', // red-500
          foreground: 'var(--color-destructive-foreground)', // white
        },
        success: {
          DEFAULT: 'var(--color-success)', // emerald-500
          foreground: 'var(--color-success-foreground)', // black
        },
        warning: {
          DEFAULT: 'var(--color-warning)', // amber-500
          foreground: 'var(--color-warning-foreground)', // black
        },
        error: {
          DEFAULT: 'var(--color-error)', // red-500
          foreground: 'var(--color-error-foreground)', // white
        },
        border: 'var(--color-border)', // white/10
        input: 'var(--color-input)', // white/10
        ring: 'var(--color-ring)', // amber-500 gold
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        inter: ['Inter', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        lg: '1rem', // 16px
        md: '0.75rem', // 12px
        sm: '0.5rem', // 8px
      },
      maxWidth: {
        '8xl': '90rem', // 1440px
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}