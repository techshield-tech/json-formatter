import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // GitHub Pages serves this app from https://techshield-tech.github.io/json-formatter/
  // so built asset URLs must be prefixed with the repo name. Vercel (which sets
  // VERCEL=1 during builds) serves it from the domain root. BASE_PATH overrides both.
  const base = env.BASE_PATH || (env.VERCEL ? '/' : '/json-formatter/');

  return {
    base,
    plugins: [react(), tailwindcss()],
  };
});
