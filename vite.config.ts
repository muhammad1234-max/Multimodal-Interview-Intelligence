import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: true,
  // @ts-expect-error - Vite server options are valid but missing from this specific wrapper type
  server: {
    host: "0.0.0.0",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
          framer: ['framer-motion'],
          ui: ['lucide-react', 'sonner'],
          vendor: ['react', 'react-dom', 'zod']
        }
      }
    }
  }
});
