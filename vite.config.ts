import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2022',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['dompurify', 'marked'],
          'db': ['idb']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  },
  resolve: {
    alias: {
      '@': '/src',
      '@/assets': '/src/assets',
      '@/components': '/src/components',
      '@/core': '/src/core',
      '@/services': '/src/services',
      '@/stores': '/src/stores',
      '@/types': '/src/types',
      '@/utils': '/src/utils'
    }
  },
  css: {
    devSourcemap: true
  }
});
