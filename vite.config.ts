import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// ssr: { // Moving externalization to build.rollupOptions
	// 	external: ['@google/generative-ai']
	// },
	build: {
		rollupOptions: {
			// Explicitly externalize packages causing issues in Netlify build
			external: ['@google/generative-ai', 'pdf-parse']
		}
	}
});
