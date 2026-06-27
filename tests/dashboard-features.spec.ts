import { test, expect } from '@playwright/test';

test.describe('Dashboard Features & Profile Settings', () => {
  test('should load tutor dashboard and update profile settings', async ({ context, page }) => {
    // 1. Set the mock session cookie to 'dashboard'
    await context.addCookies([
      {
        name: 'yazzow-test-session',
        value: 'dashboard',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Go directly to dashboard settings
    await page.goto('/dashboard/settings');


    // Verify settings form display name loads with the mock user info
    await expect(page.locator('#display-name')).toHaveValue('Test Tutor');
    await expect(page.locator('#bio')).toHaveValue('GCSE math tutor with 10 years experience');
    await page.waitForTimeout(1500);


    // 2. Modify bio details
    await page.fill('#bio', 'This is an updated biography from Playwright E2E tests.');

    // 3. Save profile changes
    await page.click('button:has-text("Save profile")');

    // Verify flash success message is displayed
    const successBanner = page.locator('text=Profile updated.');
    await expect(successBanner).toBeVisible({ timeout: 5000 });

    // 4. Verify Schedule Builder (Tutorview schedule page)
    await page.goto('/dashboard/schedule');
    await expect(page.locator('h1:has-text("Schedule Builder")')).toBeVisible();
    await expect(page.locator('text=Interactive Calendar')).toBeVisible();

    // 5. Verify Dashboard Overview (Tutorview main page)
    await page.goto('/dashboard');
    // Verify the stats matrix components loaded properly with our mock data
    await expect(page.locator('text=Bobby').first()).toBeVisible(); // Confirmed mock booking student name
    await expect(page.locator('text=testparent@example.com')).toBeVisible(); // Mock booking parent email
  });
});
