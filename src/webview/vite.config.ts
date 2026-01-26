import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  build: {
    outDir: resolve(__dirname, '../../out/webview'),
    emptyOutDir: true,
    // Production build optimizations
    minify: 'esbuild',
    target: 'es2020',
    sourcemap: true,
    // Optimize chunk splitting for better caching
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Optimize chunk splitting
        manualChunks: {
          vendor: ['react', 'react-dom'],
        }
      },
      // External dependencies that should not be bundled
      external: [],
    },
    // Asset optimization settings
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    cssCodeSplit: true,
    // Build performance optimizations
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
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
  // Enable TypeScript type checking with enhanced settings
  esbuild: {
    target: 'es2020',
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Production optimizations
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    // TypeScript-specific optimizations
    keepNames: false,
    legalComments: 'none',
  },
  // Optimize dependencies for webview with production settings
  optimizeDeps: {
    include: ['react', 'react-dom'],
    esbuildOptions: {
      target: 'es2020',
      // Production dependency optimizations
      treeShaking: true,
      minify: true,
    }
  },
  // Configure for VS Code webview environment
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  // CSS optimization settings
  css: {
    devSourcemap: true,
    // Production CSS optimizations
    postcss: {},
    preprocessorOptions: {},
    modules: {
      localsConvention: 'camelCase',
    }
  },
  // Performance and caching optimizations
  experimental: {
    renderBuiltUrl(filename: string) {
      // Ensure proper asset paths for VS Code webview
      return `./${filename}`;
    }
  }
});