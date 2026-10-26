import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const vf = (path: string) => fileURLToPath(new URL(`./src/vf/${path}`, import.meta.url));

// The port must match the Trusted URL (CspTrustedSite) and the host LWC's src.
// `vite build --mode vf` builds the same app for a Visualforce page + static resource:
// the platform SDK is swapped for src/vf/sdk.ts, and file names are fixed so the page can point at them.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: { port: 5175, strictPort: true },
  ...(mode === 'vf' && {
    base: './',
    resolve: {
      alias: [
        { find: /^@salesforce\/platform-sdk\/ui-embedding$/, replacement: vf('empty.ts') },
        { find: /^@salesforce\/platform-sdk$/, replacement: vf('sdk.ts') },
      ],
    },
    build: {
      outDir: 'dist-vf',
      rollupOptions: {
        output: { entryFileNames: 'assets/calendar.js', assetFileNames: 'assets/calendar[extname]' },
      },
    },
  }),
}));
