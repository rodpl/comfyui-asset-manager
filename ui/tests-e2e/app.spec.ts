import { test, expect } from '@playwright/test';
import { AppPageObject } from './fixtures/pageObjects/app.po';

test.describe('Asset Manager tab mounting', () => {
  test('mounts inside ComfyUI without managing its own server', async ({ page }) => {
    await page.goto('/');

    const app = new AppPageObject(page);
    await app.openAppFromSidebar();

    await expect(page.getByRole('tab', { name: /local assets/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /model browser/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /outputs/i })).toBeVisible();
  });
});
