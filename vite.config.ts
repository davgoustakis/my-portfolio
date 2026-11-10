import { defineConfig } from 'vite';

// Relative base so the build works both at username.github.io/ and username.github.io/repo/
export default defineConfig({
  base: './',
});
