import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 2000,
    },
    server: {
      allowedHosts: ['sb-28bb8qn7wylo.vercel.run'],
      // The Vercel preview proxy does not support Vite's dev-server WebSocket.
      // Disable HMR so the injected Vite client does not repeatedly close sockets.
      hmr: false,
      // Keep file watching disabled to prevent agent edits from triggering rebuild loops.
      watch: null,
    },
  };
});
