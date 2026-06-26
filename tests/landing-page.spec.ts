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
    const ticketTab = page.locator('button:has-text("Submit Ticket")');
    await ticketTab.click();
    
    // Handle hydration race condition by retrying click if the form doesn't appear
    try {
      await page.waitForSelector('#ticket-name', { state: 'visible', timeout: 2000 });
    } catch {
      await page.waitForTimeout(500);
      await ticketTab.click();
      await page.waitForSelector('#ticket-name', { state: 'visible', timeout: 3000 });
    }

    // Fill out the support ticket form
    await page.fill('#ticket-name', 'John Doe');
    await expect(page.locator('#ticket-name')).toHaveValue('John Doe');
    await page.fill('#ticket-email', 'john.doe@example.com');
    await expect(page.locator('#ticket-email')).toHaveValue('john.doe@example.com');
    await page.selectOption('#ticket-category', 'bug');
    await page.fill('#ticket-message', 'This is a test bug report from Playwright.');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify success message is displayed
    await expect(page.locator('text=Message sent')).toBeVisible();
    await expect(page.locator('text=we\'ve received your message')).toBeVisible();
  });

  test('should navigate to the support page when logged in, hide name/email, and submit a ticket', async ({ context, page }) => {
    // 1. Set the mock session cookie to 'dashboard' (logged in)
    await context.addCookies([
      { name: 'yazzow-test-session', value: 'dashboard', domain: 'localhost', path: '/' }
    ]);

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
    await expect(page).toHaveURL(/\/support/);

    // Switch to Submit Ticket tab
    const ticketTab = page.locator('button:has-text("Submit Ticket")');
    await ticketTab.click();
    
    // Handle hydration race condition by retrying click if the form doesn't appear
    try {
      await page.waitForSelector('#ticket-category', { state: 'visible', timeout: 2000 });
    } catch {
      await page.waitForTimeout(500);
      await ticketTab.click();
      await page.waitForSelector('#ticket-category', { state: 'visible', timeout: 3000 });
    }

    // Verify name and email fields are visible but disabled (auto-populated)
    await expect(page.locator('#ticket-name')).toBeVisible();
    await expect(page.locator('#ticket-name')).toBeDisabled();
    await expect(page.locator('#ticket-name')).toHaveValue('testtutor');

    await expect(page.locator('#ticket-email')).toBeVisible();
    await expect(page.locator('#ticket-email')).toBeDisabled();
    await expect(page.locator('#ticket-email')).toHaveValue('testtutor@example.com');

    // Fill out the support ticket form (just category and message)
    await page.selectOption('#ticket-category', 'billing');
    await page.fill('#ticket-message', 'Logged in support ticket message.');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify success message is displayed
    await expect(page.locator('text=Message sent')).toBeVisible();
  });
});
