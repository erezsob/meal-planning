import { err, ok, type Result } from "./fp";

/** Document / splash chrome color for the installed PWA (matches app shell `bg-gray-950`). */
export const PWA_THEME_COLOR = "#030712";

/** Public path to the web app manifest linked from the root document. */
export const PWA_MANIFEST_HREF = "/manifest.json";

/** Public path to the Apple touch icon linked from the root document. */
export const PWA_APPLE_TOUCH_ICON_HREF = "/apple-touch-icon.png";

/** Chrome install-floor minimum icon width/height (px). */
export const PWA_ICON_SIZE_192 = 192;

/** Chrome install-floor large icon width/height (px). */
export const PWA_ICON_SIZE_512 = 512;

/** Display modes Chrome treats as installable (standalone-class). */
const PWA_INSTALLABLE_DISPLAY_MODES = [
	"fullscreen",
	"standalone",
	"minimal-ui",
	"window-controls-overlay",
] as const;

type PwaInstallableDisplayMode = (typeof PWA_INSTALLABLE_DISPLAY_MODES)[number];

/**
 * Root-document install surface: theme chrome + asset links browsers need for A2HS / Install.
 */
export type DocumentInstallSurface = {
	/** HTML `theme-color` meta content. */
	readonly themeColor: string;
	/** `rel="manifest"` href. */
	readonly manifestHref: string;
	/** `rel="apple-touch-icon"` href. */
	readonly appleTouchIconHref: string;
};

/**
 * Canonical root-document install surface for Sick Meals.
 */
export const PWA_DOCUMENT_INSTALL_SURFACE: DocumentInstallSurface = {
	themeColor: PWA_THEME_COLOR,
	manifestHref: PWA_MANIFEST_HREF,
	appleTouchIconHref: PWA_APPLE_TOUCH_ICON_HREF,
};

/**
 * Minimal web app manifest shape needed to judge install-critical fields.
 */
export type WebAppManifestInstallSurface = {
	/** App name (either this or short_name is required). */
	readonly name?: string;
	/** Short name for home screen (either this or name is required). */
	readonly short_name?: string;
	/** Launch URL after install. */
	readonly start_url?: string;
	/** Display mode; must be standalone-class for installability. */
	readonly display?: string;
	/** Browser / splash chrome color. */
	readonly theme_color?: string;
	/** When true, blocks Chrome install promotion. */
	readonly prefer_related_applications?: boolean;
	/** Icon entries; must include 192 and 512 sizes. */
	readonly icons?: ReadonlyArray<{
		/** Icon file path relative to the manifest. */
		readonly src: string;
		/** Space-separated size tokens such as `"192x192"`. */
		readonly sizes?: string;
		/** MIME type. */
		readonly type?: string;
		/** Icon purpose (`any`, `maskable`, …). */
		readonly purpose?: string;
	}>;
};

export type PwaInstallSurfaceError = {
	readonly type: "PWA_INSTALL_SURFACE_INVALID";
	readonly message: string;
};

const invalid = (message: string): PwaInstallSurfaceError => ({
	type: "PWA_INSTALL_SURFACE_INVALID",
	message,
});

/**
 * Type guard for Chrome installable (standalone-class) display modes.
 */
function isPwaInstallableDisplayMode(
	value: string,
): value is PwaInstallableDisplayMode {
	return PWA_INSTALLABLE_DISPLAY_MODES.includes(
		value as PwaInstallableDisplayMode,
	);
}

/**
 * True when an icon entry covers the given pixel size (e.g. `"192x192"`).
 */
export function iconCoversSize(
	sizes: string | undefined,
	pixelSize: number,
): boolean {
	if (sizes === undefined || sizes.trim() === "") {
		return false;
	}
	const target = `${pixelSize}x${pixelSize}`;
	return sizes.split(/\s+/).includes(target);
}

/**
 * True when the icons list includes both a 192px and a 512px icon.
 */
export function hasInstallCriticalIconSizes(
	icons: WebAppManifestInstallSurface["icons"],
): boolean {
	if (icons === undefined || icons.length === 0) {
		return false;
	}
	const has192 = icons.some((icon) =>
		iconCoversSize(icon.sizes, PWA_ICON_SIZE_192),
	);
	const has512 = icons.some((icon) =>
		iconCoversSize(icon.sizes, PWA_ICON_SIZE_512),
	);
	return has192 && has512;
}

/**
 * Validate install-critical web app manifest fields (Chrome / MDN install floor).
 */
export function validateInstallCriticalManifest(
	manifest: WebAppManifestInstallSurface,
): Result<void, PwaInstallSurfaceError> {
	const hasName =
		(manifest.name !== undefined && manifest.name.trim() !== "") ||
		(manifest.short_name !== undefined && manifest.short_name.trim() !== "");
	if (!hasName) {
		return err(invalid("Manifest requires name or short_name"));
	}

	if (manifest.start_url === undefined || manifest.start_url.trim() === "") {
		return err(invalid("Manifest requires start_url"));
	}

	const display = manifest.display;
	if (display === undefined || !isPwaInstallableDisplayMode(display)) {
		return err(
			invalid(
				`Manifest display must be one of: ${PWA_INSTALLABLE_DISPLAY_MODES.join(", ")}`,
			),
		);
	}

	if (manifest.prefer_related_applications === true) {
		return err(
			invalid(
				"prefer_related_applications must be absent or false for installability",
			),
		);
	}

	if (!hasInstallCriticalIconSizes(manifest.icons)) {
		return err(invalid("Manifest requires 192px and 512px icons"));
	}

	return ok(undefined);
}

/**
 * Validate HTML theme-color matches the manifest theme_color.
 */
export function validateThemeColorParity(args: {
	readonly documentThemeColor: string;
	readonly manifestThemeColor: string | undefined;
}): Result<void, PwaInstallSurfaceError> {
	if (
		args.manifestThemeColor === undefined ||
		args.manifestThemeColor.trim() === ""
	) {
		return err(invalid("Manifest requires theme_color"));
	}
	if (args.documentThemeColor !== args.manifestThemeColor) {
		return err(
			invalid(
				`theme-color mismatch: document ${args.documentThemeColor} vs manifest ${args.manifestThemeColor}`,
			),
		);
	}
	return ok(undefined);
}

/**
 * Validate the root document still advertises the manifest and Apple touch icon.
 */
export function validateDocumentInstallLinks(
	surface: DocumentInstallSurface,
): Result<void, PwaInstallSurfaceError> {
	if (surface.manifestHref.trim() === "") {
		return err(invalid("Document must link the web app manifest"));
	}
	if (surface.appleTouchIconHref.trim() === "") {
		return err(invalid("Document must link an Apple touch icon"));
	}
	return ok(undefined);
}
