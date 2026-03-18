import { expect, test } from "@playwright/test";
import { createTestUser, signIn, signUp } from "./helpers";

test("redirects unauthenticated users and supports sign up, sign out, and sign in", async ({
  page,
}) => {
  const user = createTestUser();

  await page.goto("/");
  await expect(page).toHaveURL("/login");

  await signUp(page, user);
  await expect(page.getByText("No words yet.")).toBeVisible();

  await page.getByRole("button", { name: "Sign Out" }).click();
  await expect(page).toHaveURL("/login");

  await signIn(page, user);
  await expect(page.getByRole("heading", { name: "Your Words" })).toBeVisible();
});
