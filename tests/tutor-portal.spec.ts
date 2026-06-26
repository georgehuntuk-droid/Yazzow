import { test, expect } from '@playwright/test';

test.describe('Tutor Portal & Booking Flow', () => {
  test('should display tutor info and handle booking selections', async ({ page }) => {
    // Navigate to the demo tutor profile
    await page.goto('/tutor/maya-chen');

    // Verify profile page contains Maya Chen's info
    await expect(page.locator('h1')).toContainText('Maya Chen');
    await expect(page.locator('text=KS3 & GCSE Maths')).toBeVisible();

    // Verify calendar is visible
    await expect(page.locator('text=Book Your Lesson')).toBeVisible();

    // Click 'The shelf' tab to make resource shelf visible
    await page.click('text=The shelf');

    // Verify resource shelf is visible
    await expect(page.locator('text=Algebra Foundations Pack')).toBeVisible();

    // Click 'Book a lesson' tab to make calendar visible again
    await page.click('text=Book a lesson');

    // 1. Select a date (click the first date button in the list)
    const dateButtons = page.locator('button:has-text("Select Date") ~ div button, button:has(span:has-text("Mon")), button:has(span:has-text("Tue")), button:has(span:has-text("Wed")), button:has(span:has-text("Thu")), button:has(span:has-text("Fri")), button:has(span:has-text("Sat")), button:has(span:has-text("Sun"))');
    if (await dateButtons.count() > 0) {
      await dateButtons.first().click();
    }

    // 2. Pick a time slot
    const slotButtons = page.locator('button:has-text("Pick Time") ~ div button, button:has-text("–")');
    if (await slotButtons.count() > 0) {
      await slotButtons.first().click();
    }

    // 3. Verify booking form inputs appear (handle both logged-in and logged-out states)
    const isLoggedIn = await page.locator('text=Booking Account').count() > 0;
    if (isLoggedIn) {
      await expect(page.locator('text=Booking Account')).toBeVisible();
    } else {
      await expect(page.locator('#parent-email')).toBeVisible();
      await page.fill('#parent-email', 'testparent@example.com');
    }
    
    await expect(page.locator('#student-name')).toBeVisible();
    await page.fill('#student-name', 'Bobby');

    // Mock direct cash booking API
    await page.route('/api/tutor/book-direct', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, bookingId: 'mock-booking-id-123' }),
      });
    });

    // Mock stripe checkout API
    await page.route('/api/stripe/checkout/lesson', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/mock-pay' }),
      });
    });

    // Locate and click the booking button (e.g., Pay Directly, Confirm Booking, or Book)
    const checkoutButton = page.locator('button:has-text("Confirm Booking"), button:has-text("Redirecting"), button:has-text("Pay"), button:has-text("Book")').first();
    await expect(checkoutButton).toBeEnabled();
  });
});
