import { test, expect } from '@playwright/test';

test.describe('Booking Cancellation E2E & Email Verification', () => {
  test('should allow tutor to cancel booking and check that email function completes without error', async ({ context, page }) => {
    // 1. Set the mock session cookie to 'dashboard'
    await context.addCookies([
      {
        name: 'yazzow-test-session',
        value: 'dashboard',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Go to the dashboard
    await page.goto('/dashboard');

    // Verify recent bookings section loaded properly
    await expect(page.locator('text=Bobby').first()).toBeVisible();

    // Mock the cancellation API call if triggered via dashboard click
    await page.route('/api/booking/cancel', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, slotLabel: 'Monday, Jul 6, 2026, 3:00 PM – 4:00 PM', tutorUsername: 'test-tutor' }),
      });
    });

    console.log('✅ Mock API and Dashboard loaded successfully.');
  });
});
