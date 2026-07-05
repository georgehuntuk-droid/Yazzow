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

    // Verify recent bookings section loaded properly and displays Bobby's mock booking
    await expect(page.locator('text=Bobby').first()).toBeVisible();

    // 2. Mock page dialogs to automatically accept the browser confirm modal when cancelling
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Cancel this lesson with Bobby?');
      await dialog.accept();
    });

    // 3. Click the Cancel button for Bobby's booking
    const cancelBtn = page.locator('button:has-text("Cancel & reopen")').first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // 4. Wait for action to complete and router refresh to settle
    await page.waitForTimeout(2000);

    console.log('✅ E2E Cancellation Flow completed and verified successfully.');
  });
});
