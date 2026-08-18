import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

test("keeps the desktop research inspector stable at the xl boundary", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
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
});
