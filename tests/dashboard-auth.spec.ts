import { test, expect } from '@playwright/test';

test.describe('Dashboard & Authentication Flow', () => {
  test('should protect dashboard route and redirect unauthenticated users', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard');

    // Should redirect to login page (either URL contains /auth/login or page contains auth title)
    await page.waitForURL(/.*\/auth\/login.*/);
    await expect(page).toHaveURL(/.*\/auth\/login.*/);

    // Verify login page elements
    await expect(page.locator('h1:has-text("Welcome back to Yazzow"), [data-slot="card-title"]:has-text("Welcome back")').first()).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should show error banner when signing in with incorrect credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForTimeout(1500);

    // Fill form with dummy incorrect credentials
    await page.fill('#email', 'wrongtutor@example.com');
    await page.fill('#password', 'wrongpassword123');

    // Click submit
    await page.click('button[type="submit"]');

    // Verify error banner appears immediately
    const errorBanner = page.locator('.text-destructive').first();
    await expect(errorBanner).toBeVisible({ timeout: 10000 });
  });
});
