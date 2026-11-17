import { test, expect } from "@playwright/test";

test.describe("Auth & dashboard smoke", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("admin can login and reach admin dashboard", async ({ page }) => {
    test.skip(!process.env.E2E_RUN_LIVE, "Set E2E_RUN_LIVE=1 with app+API running to execute live login flow");
    await page.goto("/login");
    await page.getByPlaceholder("Email").fill(process.env.E2E_ADMIN_EMAIL || "admin@teamalgebra.local");
    await page.getByPlaceholder("Password").fill(process.env.E2E_ADMIN_PASSWORD || "Password123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin/);
  });
});
