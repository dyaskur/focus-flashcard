import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  plugins: [tailwindcss(), sveltekit({ adapter: adapter(), alias: { $lib: 'src/lib' } })],
  test: { include: ['src/**/*.test.ts', 'tests/**/*.test.ts'], testTimeout: 15000 }
});
