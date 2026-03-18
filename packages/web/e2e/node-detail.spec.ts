import { expect, test } from "@playwright/test";
import { addWord, signUp } from "./helpers";

test("shows node details and lets the user follow connections", async ({ page }) => {
  await signUp(page);
  await addWord(page, "示唆");

  await page.goto("/");
  await page.getByRole("link", { name: /示唆/ }).click();

  await expect(page).toHaveURL(/\/nodes\//);
  await expect(page.getByRole("heading", { name: "示唆" })).toBeVisible();
  await expect(page.locator(".node-header .reading")).toHaveText("しさ");
  await expect(page.getByText("彼の発言は今後の方針を示唆していた。")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Connections \(3\)/ })).toBeVisible();
  await expect(page.getByText("shares kanji")).toBeVisible();

  await page.getByRole("link", { name: /示す/ }).click();
  await expect(page.getByRole("heading", { name: "示す" })).toBeVisible();
  await expect(page.locator(".node-header .reading")).toHaveText("しめす");
});
