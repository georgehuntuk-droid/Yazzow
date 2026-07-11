import { test, expect } from '@playwright/test';

test.describe('Free Public SEO Tools', () => {
  test('should load invoice generator, calculate total, and handle reset', async ({ page }) => {
    // 1. Navigate to invoice generator tool
    await page.goto('/tools/invoice-generator');

    // 2. Verify title and metadata structure is correct
    await expect(page.locator('h1')).toContainText('Tutor Invoice Generator');

    // 3. Verify total is calculated correctly (default items: £90 + £60 + £15 = £165.00)
    const totalSelector = page.locator('text=Total Due');
    await expect(totalSelector).toBeVisible();
    await expect(page.locator('text=£165.00').first()).toBeVisible();

    // 4. Change the rate/price of the first item to £60
    // Index 0: First item hours, Index 1: First item rate
    const rateInput = page.locator('input[type="number"]').nth(1);
    await rateInput.fill('60');

    // 5. Verify the total updates dynamically to £195.00
    await expect(page.locator('text=£195.00').first()).toBeVisible();

    // 6. Click Reset button and accept the confirm dialog
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('reset');
      await dialog.accept();
    });
    await page.click('text=Reset');

    // 7. Verify it resets back to default values (£165.00)
    await expect(page.locator('text=£165.00').first()).toBeVisible();
  });

  test('should load rate calculator, walk through steps, and show recommended pricing', async ({ page }) => {
    // 1. Navigate to rate calculator tool
    await page.goto('/tools/rate-calculator');

    // 2. Verify title and start screen
    await expect(page.locator('h1')).toContainText('Tutor Rate Calculator');

    // 3. Step 1: main tutoring subject (select Mathematics)
    await page.click('button:has-text("Mathematics")');
    await page.click('button:has-text("Continue")');

    // 4. Step 2: level (select GCSE / Middle School)
    await page.click('button:has-text("GCSE / Middle School")');
    await page.click('button:has-text("Continue")');

    // 5. Step 3: experience (select Qualified School Teacher)
    await page.click('button:has-text("Qualified School Teacher")');
    await page.click('button:has-text("Continue")');

    // 6. Step 4: location (select Greater London Area)
    await page.click('button:has-text("Greater London Area (In-person)")');
    await page.click('button:has-text("Continue")');

    // 7. Verify the final screen shows the results
    await expect(page.locator('text=Recommended Hourly Rate')).toBeVisible();
    
    // Maths (30) + GCSE (0) + Teacher (18) + London (15) = £63/hr base rate, min £58, max £68
    await expect(page.locator('text=£58')).toBeVisible();
    await expect(page.locator('text=£68')).toBeVisible();
  });

  test('should load tools integrated inside tutor dashboard layout', async ({ context, page }) => {
    // Set the mock session cookie to 'dashboard' to access dashboard pages
    await context.addCookies([
      {
        name: 'yazzow-test-session',
        value: 'dashboard',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // 1. Go to dashboard invoice maker
    await page.goto('/dashboard/tools/invoice-generator');
    await expect(page.locator('h1')).toContainText('Tutor Invoice Generator');
    // Sidebar should be visible in dashboard layout
    await expect(page.locator('text=Tutor Workspace').first()).toBeVisible();

    // 2. Go to dashboard rate calculator
    await page.goto('/dashboard/tools/rate-calculator');
    await expect(page.locator('h1')).toContainText('Tutor Rate Calculator');
    await expect(page.locator('text=Tutor Workspace').first()).toBeVisible();
  });
});
