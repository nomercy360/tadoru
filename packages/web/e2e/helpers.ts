import { expect, type Page } from "@playwright/test";

export type TestUser = {
  name: string;
  email: string;
  password: string;
};

const DEFAULT_PASSWORD = "Password123";

function uniqueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTestUser(): TestUser {
  const id = uniqueId();
  return {
    name: `E2E User ${id}`,
    email: `e2e-${id}@example.com`,
    password: DEFAULT_PASSWORD,
  };
}

export async function signUp(page: Page, user: TestUser = createTestUser()) {
  await page.goto("/signup");
  await page.getByPlaceholder("Name").fill(user.name);
  await page.getByPlaceholder("Email").fill(user.email);
  await page.getByPlaceholder("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign Up" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(user.name)).toBeVisible();

  return user;
}

export async function signIn(page: Page, user: TestUser) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(user.email);
  await page.getByPlaceholder("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(user.name)).toBeVisible();
}

export async function addWord(page: Page, surface: string) {
  await page.goto("/add");
  await page.getByPlaceholder("示唆, にもかかわらず, 示...").fill(surface);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("heading", { name: surface })).toBeVisible();
}
