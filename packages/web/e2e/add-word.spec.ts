import { expect, test } from "@playwright/test";
import { addWord, signUp } from "./helpers";

test("adds a word, shows enrichment, and blocks duplicates", async ({ page }) => {
  await signUp(page);
  await addWord(page, "示唆");

  await expect(page.getByText("しさ")).toBeVisible();
  await expect(page.getByText("suggestion")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Connections \(3\)/ })).toBeVisible();
  await expect(page.getByText("shares kanji")).toBeVisible();

  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page.getByRole("link", { name: /示唆/ })).toBeVisible();

  await page.getByRole("link", { name: "Add Word" }).click();
  await page.getByPlaceholder("示唆, にもかかわらず, 示...").fill("示唆");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Node already exists")).toBeVisible();
});

test("disables add until the input has content", async ({ page }) => {
  await signUp(page);
  await page.goto("/add");

  await expect(page.getByRole("button", { name: "Add" })).toBeDisabled();
  await page.getByPlaceholder("示唆, にもかかわらず, 示...").fill("食べる");
  await expect(page.getByRole("button", { name: "Add" })).toBeEnabled();
});
