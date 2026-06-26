import { test, expect } from '@playwright/test';

test.describe('Sign up & Onboarding Stepper Flow', () => {
  test('should go through onboarding, validate username, and complete onboarding', async ({ context, page }) => {
    // 1. Set the mock session cookie to 'onboarding'
    await context.addCookies([
      {
        name: 'yazzow-test-session',
        value: 'onboarding',
        domain: 'localhost',
        path: '/',
      },
    ]);


    // Go directly to onboarding
    await page.goto('/onboarding');

    // Verify we are on onboarding page
    await expect(page.locator('h1:has-text("Claim your portal link")')).toBeVisible();
    await page.waitForTimeout(1500);


    // 2. Test duplicate/taken username validation error
    await page.fill('#username', 'takenusername');
    await page.fill('#displayName', 'Maya Chen');
    await page.fill('#headline', 'Math GCSE');
    await page.fill('#bio', 'I am a highly rated tutor.');
    
    // Submit
    await page.click('button[type="submit"]');

    // Verify error banner for taken username
    const errorBanner = page.locator('.text-destructive').first();
    await expect(errorBanner).toBeVisible({ timeout: 5000 });
    await expect(errorBanner).toContainText(/taken/i);

    // 3. Complete onboarding with a valid username
    await page.fill('#username', 'available-test-username');
    
    // Update cookie to 'dashboard' before submitting so that the redirect target `/dashboard` accepts the user
    await context.addCookies([
      {
        name: 'yazzow-test-session',
        value: 'dashboard',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Submit form
    await page.click('button[type="submit"]');

    // Page should redirect to /dashboard
    await page.waitForURL(/.*\/dashboard.*/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*\/dashboard.*/);
  });
});
