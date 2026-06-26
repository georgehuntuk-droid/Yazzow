import { test, expect } from '@playwright/test';

test.describe('Form Validations & Error Triggers', () => {
  test('should trigger validation errors on support page form', async ({ page }) => {
    await page.goto('/support');
    await page.waitForTimeout(1000); // Wait for hydration
    
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

    // Click submit without filling required fields
    const submitBtn = page.locator('button:has-text("Send message")');
    await submitBtn.click();

    // HTML5 validation check: the browser should mark the first input as invalid
    const isNameInvalid = await page.$eval('#ticket-name', (el: HTMLInputElement) => !el.validity.valid);
    expect(isNameInvalid).toBe(true);

    // Fill only name, click submit again, email should be invalid
    await page.fill('#ticket-name', 'John Doe');
    await expect(page.locator('#ticket-name')).toHaveValue('John Doe');
    await submitBtn.click();
    const isEmailInvalid = await page.$eval('#ticket-email', (el: HTMLInputElement) => !el.validity.valid);
    expect(isEmailInvalid).toBe(true);

    // Fill invalid email format
    await page.fill('#ticket-email', 'invalid-email-format');
    await expect(page.locator('#ticket-email')).toHaveValue('invalid-email-format');
    await submitBtn.click();
    const isEmailStillInvalid = await page.$eval('#ticket-email', (el: HTMLInputElement) => !el.validity.valid);
    expect(isEmailStillInvalid).toBe(true);
  });

  test('should validate password length on signup page', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForTimeout(1000); // Wait for hydration

    // Fill valid email but short password
    await page.fill('#email', 'testtutor@example.com');
    await page.fill('#password', 'short');

    // Click submit
    await page.click('button[type="submit"]');

    // Verify HTML5 length validation or UI warning is triggered
    const isPasswordInvalid = await page.$eval('#password', (el: HTMLInputElement) => !el.validity.valid);
    expect(isPasswordInvalid).toBe(true);
  });

  test('should validate required fields on login page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForTimeout(1000); // Wait for hydration

    // Click submit without entering email or password
    await page.click('button[type="submit"]');

    // Email should be marked as invalid
    const isEmailInvalid = await page.$eval('#email', (el: HTMLInputElement) => !el.validity.valid);
    expect(isEmailInvalid).toBe(true);
  });
});
