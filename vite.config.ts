import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 950, // the lazy 3D chunk (three + React Three Fiber + Drei)
    rollupOptions: {
      output: {
        // Function form, so only the parts of three / fiber / drei that are actually used get bundled.
        manualChunks(id) {
          if (id.includes('vite/preload-helper') || id.includes('commonjsHelpers')) return 'react'; // keep the 3D chunk off the critical path
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run)\//.test(id)) return 'react';
          if (/node_modules\/(three|@react-three|three-stdlib|three-mesh-bvh|maath|troika-|meshline|camera-controls|stats-gl|suspend-react|zustand|its-fine|react-reconciler|react-use-measure|tunnel-rat|detect-gpu|@monogrid|@use-gesture|glsl-noise|hls\.js|@mediapipe)/.test(id)) return 'three';
          return undefined;
        },
      },
    },
  },
});
