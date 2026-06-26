import { test } from '@playwright/test';
import * as path from 'path';

const screenshotDir = 'C:/Users/Gaming/.gemini/antigravity/brain/f20c6cb8-ee58-4ac2-847d-af2e9e2febae/screenshots';

test.describe('Capture Screenshots for Ergonomic Review', () => {
  test('capture all main views', async ({ context, page }) => {
    // Set viewport size for clean desktop review
    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. Landing Page
    await page.goto('/');
    await page.screenshot({ path: path.join(screenshotDir, 'landing-page.png'), fullPage: true });

    // 2. Support Page
    await page.goto('/support');
    await page.screenshot({ path: path.join(screenshotDir, 'support-page.png'), fullPage: true });

    // 3. Onboarding Page (with onboarding cookie)
    await context.addCookies([
      { name: 'yazzow-test-session', value: 'onboarding', domain: 'localhost', path: '/' }
    ]);
    await page.goto('/onboarding');
    await page.screenshot({ path: path.join(screenshotDir, 'onboarding-page.png'), fullPage: true });

    // 4. Tutor Public Profile (Maya Chen)
    await page.goto('/tutor/maya-chen');
    await page.screenshot({ path: path.join(screenshotDir, 'tutor-public-profile.png'), fullPage: true });

    // 5. Tutor Dashboard (with dashboard cookie)
    await context.addCookies([
      { name: 'yazzow-test-session', value: 'dashboard', domain: 'localhost', path: '/' }
    ]);
    await page.goto('/dashboard');
    await page.screenshot({ path: path.join(screenshotDir, 'tutor-dashboard.png'), fullPage: true });

    // 6. Tutor Dashboard Schedule
    await page.goto('/dashboard/schedule');
    await page.screenshot({ path: path.join(screenshotDir, 'tutor-dashboard-schedule.png'), fullPage: true });
  });
});
