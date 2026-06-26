import { test, expect } from '@playwright/test';

test.describe('Landing Page & Navigation', () => {
  test('should load the landing page and verify key sections', async ({ page }) => {
    // Go to the home page
    await page.goto('/');

    // Check title contains Yazzow
    await expect(page).toHaveTitle(/Yazzow/i);

    // Verify key landing page components exist
    const featuresLink = page.locator('nav').filter({ hasText: 'Features' }).first();
    await expect(featuresLink).toBeVisible();

    const pricingLink = page.locator('nav').filter({ hasText: 'Pricing' }).first();
    await expect(pricingLink).toBeVisible();

    const supportLink = page.locator('nav').filter({ hasText: 'Support' }).first();
    await expect(supportLink).toBeVisible();
  });

  test('should navigate to the support page and submit a ticket', async ({ page }) => {
    // Mock the support ticket API submission
    await page.route('/api/support/ticket', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    // Go directly to the support page
    await page.goto('/support');

    // Wait for the support page to load
    await expect(page).toHaveURL(/\/support/);

    // Switch to Submit Ticket tab
    await page.click('text=Submit Ticket');

    // Fill out the support ticket form
    await page.fill('#ticket-name', 'John Doe');
    await page.fill('#ticket-email', 'john.doe@example.com');
    await page.selectOption('#ticket-category', 'bug');
    await page.fill('#ticket-message', 'This is a test bug report from Playwright.');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify success message is displayed
    await expect(page.locator('text=Message sent')).toBeVisible();
    await expect(page.locator('text=we\'ve received your message')).toBeVisible();
  });
});
