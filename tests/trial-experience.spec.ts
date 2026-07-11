import { test, expect } from '@playwright/test';

test.describe('Tutor 7-Day Free Trial Experience', () => {
  test('should show active trial badge and countdown on dashboard when trial is active', async ({ context, page }) => {
    // 1. Set the mock session cookie to 'trialing-active'
    await context.addCookies([
      {
        name: 'yazzow-test-session',
        value: 'trialing-active',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // 2. Navigate to dashboard page
    await page.goto('/dashboard');

    // 3. Verify it shows the tutor is a "Bronze Member (Starter)" with limits
    await expect(page.locator('text=Bronze Member (Starter)')).toBeVisible();

    // 4. Verify we do NOT see the "Activate Online Booking Checkout" warning block
    await expect(page.locator('text=Activate Online Booking Checkout')).not.toBeVisible();

    // 5. Navigate to payments page
    await page.goto('/dashboard/payments');

    // 6. Verify payments page shows "Free Trial (Starter Plan)" badge and remaining days
    const trialBadge = page.locator('text=Free Trial (Starter Plan)');
    await expect(trialBadge).toBeVisible();
    await expect(page.locator('text=6 days remaining')).toBeVisible();
  });

  test('should block bookings and show expired trial alert when trial is expired', async ({ context, page }) => {
    // 1. Set the mock session cookie to 'trialing-expired'
    await context.addCookies([
      {
        name: 'yazzow-test-session',
        value: 'trialing-expired',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // 2. Navigate to dashboard page
    await page.goto('/dashboard');

    // 3. Verify it shows the "Activate Online Booking Checkout" warning
    await expect(page.locator('text=Activate Online Booking Checkout')).toBeVisible();

    // 4. Navigate to payments page
    await page.goto('/dashboard/payments');

    // 5. Verify payments page displays "Your free trial has expired" alert banner
    await expect(page.locator('text=Your free trial has expired')).toBeVisible();
    await expect(page.locator('text=bookings have been temporarily paused')).toBeVisible();

    // 6. Verify pricing cards are visible and active to choose a plan
    await expect(page.locator('button:has-text("Choose Starter")')).toBeVisible();
  });
});
