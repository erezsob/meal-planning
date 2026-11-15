import { expect, test } from "@playwright/test";

/**
 * Continues a list in This week's Sunday dish, then writes the original text back.
 * The display button is focused and activated with Enter so the textarea stays open.
 */
test("week plan list continues on Enter", async ({ page }) => {
	await page.goto("/");
	await expect(
		page.getByRole("heading", { level: 1, name: "Weekly plan", exact: true }),
	).toBeVisible();

	const table = page
		.getByRole("region", { name: "This week" })
		.locator("table");
	const fieldName = "Sunday dish";
	const button = table.getByRole("button", { name: fieldName });
	await button.click();
	await page.keyboard.press("Enter");
	const field = table.getByRole("textbox", { name: fieldName });
	await expect(field).toBeVisible();
	const original = await field.inputValue();

	try {
		await field.fill("- apples");
		await field.press("Enter");
		await expect(field).toHaveValue("- apples\n- ");
		await field.press("Enter");
		await expect(field).toHaveValue("- apples\n");

		await field.fill("* apples");
		await field.press("Enter");
		await expect(field).toHaveValue("* apples\n* ");

		await field.fill("1. apples");
		await field.press("Enter");
		await expect(field).toHaveValue("1. apples\n2. ");
		await field.press("Backspace");
		await expect(field).toHaveValue("1. apples\n");
	} finally {
		await field.fill(original);
		await field.blur();
		await page.waitForTimeout(500);
	}
});
