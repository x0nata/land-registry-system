/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1e40af', // Blue-800
        'primary-dark': '#1e3a8a', // Blue-900
        'primary-light': '#3b82f6', // Blue-500
        'primary-lighter': '#60a5fa', // Blue-400
        'secondary': '#0ea5e9', // Sky-500
        'secondary-dark': '#0284c7', // Sky-600
        'secondary-light': '#38bdf8', // Sky-400
        'accent': '#ef4444', // Red-500
        'accent-dark': '#dc2626', // Red-600
        'accent-light': '#f87171', // Red-400
        'neutral-light': '#f3f4f6', // Gray-100
        'neutral': '#e5e7eb', // Gray-200
      }
    },
  },
  plugins: [],
  safelist: [
    'bg-primary',
    'bg-primary-dark',
    'bg-primary-light',
    'bg-primary-lighter',
    'bg-secondary',
    'bg-secondary-dark',
    'bg-secondary-light',
    'bg-accent',
    'bg-accent-dark',
    'bg-accent-light',
    'bg-neutral-light',
    'bg-neutral',
    'text-primary',
    'text-primary-dark',
    'text-primary-light',
    'text-primary-lighter',
    'text-secondary',
    'text-secondary-dark',
    'text-secondary-light',
    'text-accent',
    'text-accent-dark',
    'text-accent-light',
    'border-primary',
    'border-primary-dark',
    'border-primary-light',
    'border-primary-lighter',
    'border-secondary',
    'border-secondary-dark',
    'border-secondary-light',
    'border-accent',
    'border-accent-dark',
    'border-accent-light',
    'ring-primary',
    'ring-primary-dark',
    'ring-primary-light',
    'ring-primary-lighter',
    'ring-secondary',
    'ring-secondary-dark',
    'ring-secondary-light',
    'ring-accent',
    'ring-accent-dark',
    'ring-accent-light',
  ]
}
