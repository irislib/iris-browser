import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import UnoCSS from 'unocss/vite';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export function sanitizePortableHtml(html: string): string {
  return html
    .replace(/^\s*<link rel="modulepreload".*$/gm, '')
    .replace(/\s+crossorigin(?=[\s>])/g, '');
}

function portableHtmlPlugin(): Plugin {
  return {
    name: 'portable-html',
    async closeBundle() {
      const indexPath = resolve(__dirname, 'dist', 'index.html');
      try {
        const html = await readFile(indexPath, 'utf8');
        await writeFile(indexPath, sanitizePortableHtml(html), 'utf8');
      } catch {
        // Ignore when build output does not exist yet.
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    portableHtmlPlugin(),
    UnoCSS(),
    svelte(),
  ],
  root: resolve(__dirname),
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: false,
  },
  server: {
    port: 1431,
    strictPort: true,
  },
});
