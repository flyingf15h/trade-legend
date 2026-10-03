import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// the public URL, e.g. https://crumbclub.example.com. Form posts are checked against it,
			// and without it the server assumes https on whatever host the request came in on.
			paths: { origin: process.env.ORIGIN || undefined }
		})
	]
});
