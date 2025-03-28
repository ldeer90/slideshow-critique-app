import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		// Explicitly externalize the generative-ai package for SSR/Netlify Functions
		external: ['@google/generative-ai']
	}
});
