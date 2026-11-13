import { defineConfig, lazyPlugins } from "vite-plus";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
	fmt: {
		// Match the previous Biome formatter: tabs and an 80-column width.
		useTabs: true,
		printWidth: 80,
		ignorePatterns: [
			"src/routeTree.gen.ts",
			"src/styles.css",
			"convex/_generated",
			"pnpm-lock.yaml",
			"**/*.md",
			".cursor/**",
			".cta.json",
			"components.json",
			"tsconfig.json",
			"convex/tsconfig.json",
			"wrangler.jsonc",
			"public/manifest.json",
			"vite-env.d.ts",
		],
	},
	lint: {
		jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
		rules: { "vite-plus/prefer-vite-plus-imports": "error" },
		options: { typeAware: true, typeCheck: true },
		ignorePatterns: [
			"src/routeTree.gen.ts",
			"src/styles.css",
			"convex/_generated",
		],
	},
	plugins: lazyPlugins(() => [
		devtools(),
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		tanstackStart(),
		viteReact({
			babel: { plugins: ["babel-plugin-react-compiler"] },
		}),
	]),
});
