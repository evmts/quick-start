import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { vitePluginTevm } from "@tevm/bundler/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
	define: {
		global: "globalThis",
	},
	plugins: [
		vitePluginTevm(),
		nodePolyfills({
			include: ["stream"],
			globals: {
				process: true,
				Buffer: true,
				global: true,
			},
		}),
	],
});
