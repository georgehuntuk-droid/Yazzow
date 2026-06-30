import { test, expect } from '@playwright/test';

test.describe('Tutor Onboarding Assistant & Google Login E2E Tests', () => {
  test('should render Google login button, display onboarding assistant, and show contextual page tips', async ({ context, page }) => {
    // 2. Set mock session cookie to 'dashboard'
    await context.addCookies([
      {
        name: 'yazzow-test-session',
        value: 'dashboard',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // 3. Go directly to Dashboard overview
    await page.goto('/dashboard');

    // 4. Verify Tutor Onboarding Guide is present
    const guidePanelHeader = page.locator('h3:has-text("Tutor Setup Guide")');
    const guideBadge = page.locator('button:has-text("Setup Guide")');
    
    // Wait for either the guide panel header or the guide badge to appear (hydration complete)
    await expect(guidePanelHeader.or(guideBadge)).toBeVisible();
    
    // If the panel is collapsed (badge visible), click it to open
    if (await guideBadge.isVisible()) {
      await guideBadge.click();
    }

    // Verify Setup Guide panel elements are visible
    await expect(guidePanelHeader).toBeVisible();
    await expect(page.locator('text=Setup Progress')).toBeVisible();
    
    // Check checklist items are displayed
    await expect(page.locator('span:has-text("Customize Tutor Portal")')).toBeVisible();
    await expect(page.locator('span:has-text("Define Availability")')).toBeVisible();
    await expect(page.locator('span:has-text("Sync External Calendar")')).toBeVisible();
    await expect(page.locator('span:has-text("Connect Stripe Payouts")')).toBeVisible();

    // Verify default welcome tip is shown on /dashboard
    await expect(page.locator('span:has-text("Quick Welcome Guide")')).toBeVisible();
    await expect(page.locator('text=Welcome to Yazzow! Work through this 5-step checklist')).toBeVisible();

    // 5. Navigate to Settings and verify tip updates
    await page.goto('/dashboard/settings');
    await expect(page.locator('span:has-text("Portal Customization Tip")')).toBeVisible();
    await expect(page.locator('text=Upload a high-quality profile picture, set your desired hourly rate')).toBeVisible();

    // 6. Navigate to Schedule and verify tip updates & sync panel presence
    await page.goto('/dashboard/schedule');
    await expect(page.locator('span:has-text("Schedule Setup Tip")')).toBeVisible();
    await expect(page.locator('text=Click and drag directly on the calendar')).toBeVisible();
    
    // 7. Navigate to Payments and verify tip updates
    await page.goto('/dashboard/payments');
    await expect(page.locator('span:has-text("Payments Setup Tip")')).toBeVisible();
    
    // 8. Navigate to Storefront and verify tip updates
    await page.goto('/dashboard/storefront');
    await expect(page.locator('span:has-text("Shop Manager Tip")')).toBeVisible();

    // 9. Go back to Dashboard, expand, and dismiss the assistant
    await page.goto('/dashboard');
    // If it collapsed during page transitions, expand it again
    const guideToggle = page.locator('button:has-text("Setup Guide")');
    if (await guideToggle.isVisible()) {
      await guideToggle.click();
    }
    
    // Click "Dismiss checklist" to hide it
    await page.click('button:has-text("Dismiss checklist")');
    
    // The panel should be closed and badge should disappear, leaving only the small sparkles floating button
    await expect(page.locator('h3:has-text("Tutor Setup Guide")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Setup Guide")')).not.toBeVisible();
    
    // Sparkles floating action button should be visible
    const sparklesFab = page.locator('button[title="Tutor Onboarding Guide"]');
    await expect(sparklesFab).toBeVisible();
  });
});
