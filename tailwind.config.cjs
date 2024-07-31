/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,svelte,ts}', './index.html'],
	theme: {
		extend: {}
	},
	/* eslint @typescript-eslint/no-require-imports: "off" */
	plugins: [require('daisyui')],
	daisyui: {
		logs: false
	}
};
