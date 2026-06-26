import { test, expect } from '@playwright/test';

test.describe('Form Validations & Error Triggers', () => {
  test('should trigger validation errors on support page form', async ({ page }) => {
    await page.goto('/support');
    
    // Switch to Submit Ticket tab
    await page.click('text=Submit Ticket');

    // Click submit without filling required fields
    await page.click('button[type="submit"]');

    // HTML5 validation check: the browser should mark the first input as invalid
    const isNameInvalid = await page.$eval('#ticket-name', (el: HTMLInputElement) => !el.validity.valid);
    expect(isNameInvalid).toBe(true);

    // Fill only name, click submit again, email should be invalid
    await page.fill('#ticket-name', 'John Doe');
    await page.click('button[type="submit"]');
    const isEmailInvalid = await page.$eval('#ticket-email', (el: HTMLInputElement) => !el.validity.valid);
    expect(isEmailInvalid).toBe(true);

    // Fill invalid email format
    await page.fill('#ticket-email', 'invalid-email-format');
    await page.click('button[type="submit"]');
    const isEmailStillInvalid = await page.$eval('#ticket-email', (el: HTMLInputElement) => !el.validity.valid);
    expect(isEmailStillInvalid).toBe(true);
  });

  test('should validate password length on signup page', async ({ page }) => {
    await page.goto('/auth/signup');

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

    // Click submit without entering email or password
    await page.click('button[type="submit"]');

    // Email should be marked as invalid
    const isEmailInvalid = await page.$eval('#email', (el: HTMLInputElement) => !el.validity.valid);
    expect(isEmailInvalid).toBe(true);
  });
});
