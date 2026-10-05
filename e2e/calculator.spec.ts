import { expect, test } from "@playwright/test";

const yearly = (page: import("@playwright/test").Page) => page.getByRole("heading", { name: "Your lab costs" }).locator("..").locator("p").first();

test("adds a preset and shows a yearly cost in pounds", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Where you live")).toHaveValue("GB");
  await page.getByPlaceholder(/^Add a device/).fill("r720");
  await page.getByRole("option", { name: /PowerEdge R720(?!xd)/ }).click();
  // 110 W idle, 300 W load, 15% load → 138.5 W → 1213.26 kWh → £319.33 at 26.32p
  await expect(yearly(page)).toContainText("£319");
});

test("changing region switches currency and price", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/^Add a device/).fill("n100 mini");
  await page.keyboard.press("Enter");
  await page.getByLabel("Where you live").selectOption("DE");
  await expect(yearly(page)).toContainText("€");
  await expect(page.getByLabel("Electricity price")).toHaveValue("0.438");
});

test("a shared link restores the setup", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mini PC cluster" }).click();
  await expect(page).toHaveURL(/\?s=/);
  const url = page.url();
  const total = await yearly(page).textContent();

  const other = await context.newPage();
  await other.goto(url);
  await expect(other.getByRole("listitem").filter({ hasText: "Synology 4-bay" }).first()).toBeVisible();
  await expect(yearly(other)).toHaveText(total!);
});

test("a broken link falls back to an empty setup with a notice", async ({ page }) => {
  await page.goto("/?s=garbage!!");
  await expect(page.getByRole("status")).toContainText("empty setup");
});

test("upgrade comparison shows savings and payback", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder(/^Add a device/).fill("r720xd");
  await page.keyboard.press("Enter");
  await page.getByText("Compare an upgrade").click();
  await page.getByRole("checkbox", { name: /R720xd/ }).check();
  await page.getByPlaceholder(/Add a replacement/).fill("n100 mini");
  await page.keyboard.press("Enter");
  await page.getByLabel("Upgrade cost (after selling old kit)").fill("200");
  await expect(page.getByText("Pays for itself in")).toBeVisible();
  await expect(page.getByText(/^\d+ months$/)).toBeVisible();
});
