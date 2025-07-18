import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@heroicons/react', 'react-toastify'],
          charts: ['chart.js', 'react-chartjs-2'],
          forms: ['formik', 'yup'],
          maps: ['leaflet', 'react-leaflet'],
          motion: ['framer-motion']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
