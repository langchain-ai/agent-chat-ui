import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ viewport: { width: 1280, height: 800 } });

test("keeps the desktop research inspector stable at the xl boundary", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  await page.route("http://localhost:2024/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "[]",
    });
  });

  await page.goto("/?inspectorOpen=true");
  await page.waitForLoadState("networkidle");

  const inspector = page.locator("aside");
  await expect(inspector).toBeVisible();
  await expect(
    inspector.getByRole("heading", { name: "Research run" }),
  ).toBeVisible();
  await expect(
    inspector.getByRole("button", { name: "Evidence" }),
  ).toBeVisible();
  await expect(
    inspector.getByRole("button", { name: "Runtime" }),
  ).toBeVisible();

  const bounds = await inspector.boundingBox();
  expect(bounds?.width).toBe(360);
  const widths = await page.locator("body").evaluate((body) => ({
    client: body.clientWidth,
    scroll: body.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  expect(consoleErrors).toEqual([]);

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations,
    JSON.stringify(accessibility.violations, null, 2),
  ).toEqual([]);
});
