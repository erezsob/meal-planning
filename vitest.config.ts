import { defineConfig } from "vite-plus";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		viteReact({
			babel: { plugins: ["babel-plugin-react-compiler"] },
		}),
	],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		include: ["src/**/*.{test,spec}.{ts,tsx}", "lib/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["node_modules/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"**/*.test.{ts,tsx}",
				"**/*.spec.{ts,tsx}",
				"convex/_generated/**",
			],
		},
	},
});
