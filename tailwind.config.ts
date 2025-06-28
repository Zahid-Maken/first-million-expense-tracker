import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      
        boxShadow: {
          'neo-inner': 'inset 8px 8px 16px rgba(0, 0, 0, 0.5), inset -8px -8px 16px rgba(255, 255, 255, 0.05)',
        },
      
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "pulse-slower": {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.3" },
        },
        "float": {
          "0%": { transform: "translateY(0) translateX(0)" },
          "25%": { transform: "translateY(-10px) translateX(10px)" },
          "50%": { transform: "translateY(-20px) translateX(0)" },
          "75%": { transform: "translateY(-10px) translateX(-10px)" },
          "100%": { transform: "translateY(0) translateX(0)" },
        },
        "float-slow": {
          "0%": { transform: "translateY(0) translateX(0)" },
          "33%": { transform: "translateY(-15px) translateX(15px)" },
          "66%": { transform: "translateY(-30px) translateX(-10px)" },
          "100%": { transform: "translateY(0) translateX(0)" },
        },
        "float-medium": {
          "0%": { transform: "translateY(0) translateX(0) rotate(0deg)" },
          "25%": { transform: "translateY(-12px) translateX(8px) rotate(2deg)" },
          "50%": { transform: "translateY(-24px) translateX(0) rotate(0deg)" },
          "75%": { transform: "translateY(-12px) translateX(-8px) rotate(-2deg)" },
          "100%": { transform: "translateY(0) translateX(0) rotate(0deg)" },
        },
        "float-fast": {
          "0%": { transform: "translateY(0) translateX(0) rotate(0deg)" },
          "20%": { transform: "translateY(-5px) translateX(5px) rotate(2deg)" },
          "40%": { transform: "translateY(-10px) translateX(0) rotate(4deg)" },
          "60%": { transform: "translateY(-5px) translateX(-5px) rotate(2deg)" },
          "80%": { transform: "translateY(0) translateX(-10px) rotate(0deg)" },
          "100%": { transform: "translateY(0) translateX(0) rotate(0deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse-slow 6s ease-in-out infinite",
        "pulse-slower": "pulse-slower 8s ease-in-out infinite",
        "float": "float 12s ease-in-out infinite",
        "float-slow": "float-slow 20s ease-in-out infinite",
        "float-medium": "float-medium 15s ease-in-out infinite",
        "float-fast": "float-fast 10s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
