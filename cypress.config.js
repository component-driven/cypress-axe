/* eslint @typescript-eslint/no-var-requires: "off" */
const { defineConfig } = require('cypress');

module.exports = defineConfig({
	e2e: {
		baseUrl: 'http://localhost:8080',
		video: false,
	},
});
