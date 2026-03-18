import { expect, test } from "@playwright/test";
import { addWord, signUp } from "./helpers";

test("promotes frontier suggestions into the main graph", async ({ page }) => {
  await signUp(page);
  await addWord(page, "示唆");

  await page.goto("/frontier");
  await expect(page.getByText("示す")).toBeVisible();

  const frontierCard = page.locator(".frontier-node", { hasText: "示す" });
  await frontierCard.getByRole("button", { name: "Add to Graph" }).click();
  await expect(page.getByText("示す")).toHaveCount(0);

  await page.goto("/");
  await expect(page.getByRole("link", { name: /示す/ })).toBeVisible();
});
