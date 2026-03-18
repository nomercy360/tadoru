import { expect, test } from "@playwright/test";
import { addWord, signUp } from "./helpers";

test("reviews due cards with click and keyboard shortcuts", async ({ page }) => {
  await signUp(page);
  await addWord(page, "示唆");
  await addWord(page, "食べる");

  await page.goto("/review");
  await expect(page.getByText("1 / 2")).toBeVisible();
  await expect(page.getByText("示唆")).toBeVisible();

  await page.keyboard.press("Space");
  await expect(page.getByText("しさ")).toBeVisible();
  await expect(page.getByRole("button", { name: /Good/ })).toBeVisible();
  await page.keyboard.press("4");

  await expect(page.getByText("2 / 2")).toBeVisible();
  await expect(page.getByText("食べる")).toBeVisible();

  await page.getByText("食べる").click();
  await expect(page.getByText("たべる")).toBeVisible();
  await page.getByRole("button", { name: /Easy/ }).click();

  await expect(page.getByRole("heading", { name: "Session complete" })).toBeVisible();
  await expect(page.getByText("Reviewed 2 cards.")).toBeVisible();

  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "No cards due" })).toBeVisible();
});
