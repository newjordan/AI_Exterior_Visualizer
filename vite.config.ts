import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relative asset paths so the same build works on GitHub Pages project sites,
// Vercel, and `vite preview` without a hardcoded repository name.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
