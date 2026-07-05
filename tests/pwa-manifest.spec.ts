import { test, expect } from '@playwright/test';

test.describe('PWA & Manifest E2E Tests', () => {
  test('should register manifest link on the main landing page', async ({ page }) => {
    // Go to the home page
    await page.goto('/');

    // Check that the manifest link tag is present in the document head
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /manifest\.json/);
  });

  test('should expose a dynamic manifest for tutor portals', async ({ page }) => {
    // Navigate to the demo tutor profile page
    await page.goto('/tutor/maya-chen');

    // Check that the tutor portal has its custom manifest link
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', /\/api\/tutor\/maya-chen\/manifest\.json/);
  });

  test('should return a valid JSON payload for dynamic tutor manifests', async ({ request }) => {
    // Request the manifest API endpoint directly
    const response = await request.get('/api/tutor/maya-chen/manifest.json');
    expect(response.ok()).toBe(true);

    const manifest = await response.json();
    
    // Verify properties of the PWA manifest
    expect(manifest).toHaveProperty('name', 'Maya Chen Portal');
    expect(manifest).toHaveProperty('short_name', 'Maya Chen');
    expect(manifest).toHaveProperty('display', 'standalone');
    expect(manifest).toHaveProperty('start_url', '/tutor/maya-chen');
    expect(manifest).toHaveProperty('scope', '/tutor/maya-chen');
    expect(manifest).toHaveProperty('theme_color');
    expect(manifest).toHaveProperty('background_color');

    // Verify icons are present and structured correctly
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.icons[0]).toHaveProperty('sizes', '512x512');
    expect(manifest.icons[0]).toHaveProperty('purpose', 'any');
  });
});
