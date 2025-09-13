/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,md,mdx}",
  ],

  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '32px' }],
        '2xl': ['24px', { lineHeight: '36px' }],
        '3xl': ['30px', { lineHeight: '40px' }],
      },
      fontFamily: {
        'serif': ['"Squada One"', '"Mochiy Pop One"'],
        'sans': ['"Rajdhani"', '"M PLUS 2"'],
        'mono': ['"JetBrains Mono"', '"M PLUS 1 Code"'],
        'arcade': ['"Silkscreen"', '"DotGothic16"'],
        'specs': ['"Share Tech Mono"', '"Workbench"'],
        'ascii': ['monospace'],
        'mark': ['"Dela Gothic One"', '"Wavefont"'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        // Modo claro
        elementary: "hsl(var(--elementary))",       // Blanco (modo claro) / Negro (modo oscuro)
        void: "#000000",
        primary: "#1b1b1b",
        secondary: "#e2e2e3", // e2e2e3 vs d1d4db
        cloud: "#d0d0d0",   // d0d0d0 vs d1d5db
        night: "#3b82f6",
        feather: "#2ca798",     // Miku

        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" }
        },
        clouds: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        clouds2: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        spriteAnimation: {
          '0%': { backgroundPosition: '0 -100px' },
          '100%': { backgroundPosition: '0 -6520px' }
        },
      },

      // Animaciones
      animation: {
        float: "float 3s ease-in-out infinite",
        clouds: 'clouds 50s linear infinite',
        clouds2: 'clouds 15s linear infinite',
        blink: 'blink 1s step-start infinite',
        sprite: 'spriteAnimation 3.5s steps(34) infinite',
      },
    },
  },
  plugins: [typography],
}
