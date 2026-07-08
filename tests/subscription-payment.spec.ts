import { test, expect } from '@playwright/test';

test.describe('Subscription Payment & Stripe Return Flow', () => {
  test('should show finalizing state when returning from Stripe before webhook processes', async ({ context, page }) => {
    // 1. Set the mock session cookie to 'onboarding' (unsubscribed)
    await context.addCookies([
      {
        name: 'yazzow-test-session',
        value: 'onboarding',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // 2. Navigate to payments page with active subscription query parameter
    await page.goto('/dashboard/payments?subscription=active');

    // 3. Verify it shows the "Finalizing your subscription..." pending banner
    const pendingBanner = page.locator('text=Finalizing your subscription…');
    await expect(pendingBanner).toBeVisible();
    await expect(page.locator('text=We are secure-syncing your billing details with Stripe')).toBeVisible();

    // 4. Verify Stripe payouts section is NOT visible yet since subscription is not active
    await expect(page.locator('text=Stripe payouts')).not.toBeVisible();
  });

  test('should show success banner and show dashboard components when returning subscribed', async ({ context, page }) => {
    // 1. Set the mock session cookie to 'dashboard' (subscribed)
    await context.addCookies([
      {
        name: 'yazzow-test-session',
        value: 'dashboard',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // 2. Navigate to payments page with active subscription query parameter
    await page.goto('/dashboard/payments?subscription=active');

    // 3. Verify it shows the successful activation banner
    const successBanner = page.locator('text=Subscription activated successfully!');
    await expect(successBanner).toBeVisible();
    await expect(page.locator('text=Thank you for subscribing. Your plan is now fully active.')).toBeVisible();

    // 4. Verify the Stripe payouts section is now visible and active
    await expect(page.locator('text=Stripe payouts')).toBeVisible();
  });
});
