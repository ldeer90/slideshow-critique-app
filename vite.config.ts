import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// ssr: { // Moving externalization to build.rollupOptions
	// 	external: ['@google/generative-ai']
	// },
	build: {
		rollupOptions: {
			// Explicitly externalize the generative-ai package as suggested by Netlify logs
			external: ['@google/generative-ai']
		}
	}
});
