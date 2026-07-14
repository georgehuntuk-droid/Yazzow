import { test, expect } from "@playwright/test";

test.describe("Cancellation Waitlist Claim Flow", () => {
  test("should load slot details and successfully claim an open slot", async ({ context, page }) => {
    // 1. Set the mock session cookie
    await context.addCookies([
      {
        name: "yazzow-test-session",
        value: "dashboard",
        domain: "localhost",
        path: "/",
      },
    ]);

    // 2. Navigate to the mock valid slot claim page
    await page.goto("/slots/claim/mock-valid-token");

    // 3. Verify page elements
    await expect(page.locator("text=Claim Waitlist Slot")).toBeVisible();
    await expect(page.locator("text=Mock Tutor")).toBeVisible();
    await expect(page.locator("text=GCSE Maths")).toBeVisible();

    // 4. Fill in booking claim details
    await page.fill("#email", "parent@example.com");
    await page.fill("#student", "Bobby");

    // 5. Submit the claim
    await page.click('button:has-text("Confirm & Claim Slot")');

    // 6. Verify success state
    await expect(page.locator("text=Lesson Slot Secured!")).toBeVisible();
    await expect(page.locator("text=Bobby")).toBeVisible();
  });

  test("should show already claimed screen for a claimed slot token", async ({ context, page }) => {
    await context.addCookies([
      {
        name: "yazzow-test-session",
        value: "dashboard",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/slots/claim/mock-claimed-token");

    // Verify already claimed state
    await expect(page.locator("text=Already Claimed")).toBeVisible();
    await expect(page.locator("text=Another parent secured this lesson slot")).toBeVisible();
  });

  test("should show error when claiming with unregistered parent details", async ({ context, page }) => {
    await context.addCookies([
      {
        name: "yazzow-test-session",
        value: "dashboard",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/slots/claim/mock-valid-token");

    // Fill in unregistered email
    await page.fill("#email", "invalid@example.com");
    await page.fill("#student", "Bobby");

    await page.click('button:has-text("Confirm & Claim Slot")');

    // Verify registration warning is displayed
    await expect(
      page.locator("text=No student profile matching those details was found")
    ).toBeVisible();
  });

  test("should return 404 not found for an invalid token", async ({ context, page }) => {
    await context.addCookies([
      {
        name: "yazzow-test-session",
        value: "dashboard",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Go to invalid token URL
    const response = await page.goto("/slots/claim/mock-invalid-token");
    
    // Verify either 404 status code or not found page content
    const status = response?.status();
    if (status === 404) {
      expect(status).toBe(404);
    } else {
      // Fallback for dev/server environments rendering 200 error pages
      const notFoundText = page.locator("text=This page could not be found").or(page.locator("text=404"));
      await expect(notFoundText.first()).toBeVisible();
    }
  });
});
