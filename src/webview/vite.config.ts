import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  build: {
    outDir: resolve(__dirname, '../../out/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  server: {
    port: parseInt(process.env.VITE_DEV_SERVER_PORT || '3000'),
    host: 'localhost',
    strictPort: false, // Allow fallback to other ports if specified port is busy
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false
    },
    hmr: {
      port: parseInt(process.env.VITE_HMR_PORT || '3001'),
      host: 'localhost',
      clientPort: parseInt(process.env.VITE_HMR_PORT || '3001')
    },
    // Configure for webview development
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  base: './',
  // Enable TypeScript type checking
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  // Optimize dependencies for webview
  optimizeDeps: {
    include: ['react', 'react-dom'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  // Configure for VS Code webview environment
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});