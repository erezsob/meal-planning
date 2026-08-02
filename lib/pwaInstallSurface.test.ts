import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	hasInstallCriticalIconSizes,
	iconCoversSize,
	PWA_APPLE_TOUCH_ICON_HREF,
	PWA_DOCUMENT_INSTALL_SURFACE,
	PWA_MANIFEST_HREF,
	PWA_THEME_COLOR,
	validateDocumentInstallLinks,
	validateInstallCriticalManifest,
	validateThemeColorParity,
	type WebAppManifestInstallSurface,
} from "./pwaInstallSurface";

const repoRoot = resolve(import.meta.dirname, "..");

function loadManifest(): WebAppManifestInstallSurface {
	const raw = readFileSync(resolve(repoRoot, "public/manifest.json"), "utf8");
	return JSON.parse(raw) as WebAppManifestInstallSurface;
}

function loadRootRouteSource(): string {
	return readFileSync(resolve(repoRoot, "src/routes/__root.tsx"), "utf8");
}

describe("iconCoversSize", () => {
	it("matches an exact size token", () => {
		expect(iconCoversSize("192x192", 192)).toBe(true);
		expect(iconCoversSize("192x192", 512)).toBe(false);
	});

	it("matches among space-separated sizes", () => {
		expect(iconCoversSize("64x64 32x32 192x192", 192)).toBe(true);
	});

	it("rejects missing sizes", () => {
		expect(iconCoversSize(undefined, 192)).toBe(false);
		expect(iconCoversSize("", 192)).toBe(false);
	});
});

describe("hasInstallCriticalIconSizes", () => {
	it("requires both 192 and 512", () => {
		expect(
			hasInstallCriticalIconSizes([
				{ src: "a.png", sizes: "192x192" },
				{ src: "b.png", sizes: "512x512" },
			]),
		).toBe(true);
		expect(
			hasInstallCriticalIconSizes([{ src: "a.png", sizes: "192x192" }]),
		).toBe(false);
	});
});

describe("validateInstallCriticalManifest", () => {
	it("accepts a minimal installable manifest", () => {
		const result = validateInstallCriticalManifest({
			name: "Sick Meals",
			start_url: "/",
			display: "standalone",
			icons: [
				{ src: "icon-192.png", sizes: "192x192" },
				{ src: "icon-512.png", sizes: "512x512" },
			],
		});
		expect(result.ok).toBe(true);
	});

	it("rejects prefer_related_applications true", () => {
		const result = validateInstallCriticalManifest({
			short_name: "Meals",
			start_url: "/",
			display: "standalone",
			prefer_related_applications: true,
			icons: [
				{ src: "icon-192.png", sizes: "192x192" },
				{ src: "icon-512.png", sizes: "512x512" },
			],
		});
		expect(result.ok).toBe(false);
	});

	it("rejects non-standalone-class display", () => {
		const result = validateInstallCriticalManifest({
			name: "Sick Meals",
			start_url: "/",
			display: "browser",
			icons: [
				{ src: "icon-192.png", sizes: "192x192" },
				{ src: "icon-512.png", sizes: "512x512" },
			],
		});
		expect(result.ok).toBe(false);
	});
});

describe("validateThemeColorParity", () => {
	it("accepts matching colors", () => {
		const result = validateThemeColorParity({
			documentThemeColor: "#030712",
			manifestThemeColor: "#030712",
		});
		expect(result.ok).toBe(true);
	});

	it("rejects mismatched colors", () => {
		const result = validateThemeColorParity({
			documentThemeColor: "#030712",
			manifestThemeColor: "#000000",
		});
		expect(result.ok).toBe(false);
	});
});

describe("validateDocumentInstallLinks", () => {
	it("accepts non-empty manifest and Apple touch icon hrefs", () => {
		const result = validateDocumentInstallLinks(PWA_DOCUMENT_INSTALL_SURFACE);
		expect(result.ok).toBe(true);
	});

	it("rejects empty hrefs", () => {
		expect(
			validateDocumentInstallLinks({
				themeColor: PWA_THEME_COLOR,
				manifestHref: "",
				appleTouchIconHref: PWA_APPLE_TOUCH_ICON_HREF,
			}).ok,
		).toBe(false);
		expect(
			validateDocumentInstallLinks({
				themeColor: PWA_THEME_COLOR,
				manifestHref: PWA_MANIFEST_HREF,
				appleTouchIconHref: "",
			}).ok,
		).toBe(false);
	});
});

describe("PWA install surface contract", () => {
	it("keeps install-critical manifest fields", () => {
		const result = validateInstallCriticalManifest(loadManifest());
		expect(result.ok).toBe(true);
	});

	it("keeps HTML theme-color aligned with the manifest theme_color", () => {
		const manifest = loadManifest();
		const result = validateThemeColorParity({
			documentThemeColor: PWA_DOCUMENT_INSTALL_SURFACE.themeColor,
			manifestThemeColor: manifest.theme_color,
		});
		expect(result.ok).toBe(true);
	});

	it("keeps the root document advertising the manifest and Apple touch icon", () => {
		const links = validateDocumentInstallLinks(PWA_DOCUMENT_INSTALL_SURFACE);
		expect(links.ok).toBe(true);

		const rootSource = loadRootRouteSource();
		expect(rootSource).toContain("PWA_DOCUMENT_INSTALL_SURFACE");
		expect(rootSource).toMatch(
			/theme-color[\s\S]*PWA_DOCUMENT_INSTALL_SURFACE\.themeColor/,
		);
		expect(rootSource).toMatch(
			/apple-touch-icon[\s\S]*PWA_DOCUMENT_INSTALL_SURFACE\.appleTouchIconHref/,
		);
		expect(rootSource).toMatch(
			/manifest[\s\S]*PWA_DOCUMENT_INSTALL_SURFACE\.manifestHref/,
		);
	});

	it("does not add an empty service worker solely for installability", () => {
		const rootSource = loadRootRouteSource();
		expect(rootSource).not.toMatch(/serviceWorker|navigator\.serviceWorker/i);
		expect(rootSource).not.toMatch(/workbox|vite-plugin-pwa/i);
	});
});
