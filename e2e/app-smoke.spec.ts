import { expect, test } from "@playwright/test";

/**
 * Opens the main routes against the current dev deployment.
 * Does not seed. Fails when a route shows an error heading or an alert.
 */
test("main routes open", async ({ page }) => {
	const nav = page.getByRole("navigation", { name: "Main" });

	await page.goto("/");
	await expect(
		page.getByRole("heading", { level: 1, name: "Weekly plan", exact: true }),
	).toBeVisible();
	await expect(page.getByRole("alert")).toHaveCount(0);

	await page.getByRole("link", { name: "Past plans" }).click();
	await expect(
		page.getByRole("heading", { level: 1, name: "Past plans", exact: true }),
	).toBeVisible();
	await expect(page.getByRole("alert")).toHaveCount(0);

	const planLink = page.getByRole("main").getByRole("link").first();
	if ((await planLink.count()) > 0) {
		await planLink.click();
		await expect(page).toHaveURL(/\/plans\/archive\/.+/);
		await expect(page.getByText("Read-only archive")).toBeVisible();
		await expect(
			page.getByRole("heading", { level: 1, name: "Archived plan not found" }),
		).toHaveCount(0);
		await expect(page.getByRole("alert")).toHaveCount(0);
	}

	await nav.getByRole("link", { name: "Library" }).click();
	await expect(
		page.getByRole("heading", {
			level: 1,
			name: "Recipe Library",
			exact: true,
		}),
	).toBeVisible();
	await expect(page.getByRole("alert")).toHaveCount(0);

	await page.goto("/shopping");
	await expect(
		page.getByRole("heading", { level: 1, name: "Shopping List", exact: true }),
	).toBeVisible();
	await expect(page.getByRole("alert")).toHaveCount(0);

	await nav.getByRole("link", { name: "History" }).click();
	await expect(
		page.getByRole("heading", { level: 1, name: "History", exact: true }),
	).toBeVisible();
	await expect(page.getByRole("alert")).toHaveCount(0);
});
