import { test, expect } from '@playwright/test';
import { AppPageObject } from './fixtures/pageObjects/AppPageObject';
import { OutputsPageObject } from './fixtures/pageObjects/OutputsPageObject';

test.describe('Outputs tab - resilient UI checks', () => {
  test('toolbar, sorting and view toggles work regardless of data volume', async ({ page }) => {
    await page.goto('/');
    const app = new AppPageObject(page);
    await app.openAppFromSidebar();
    await app.switchToOutputs();

    const outputs = new OutputsPageObject(page);
    await outputs.expectToolbarVisible();
    await outputs.toggleViewModes();
    await outputs.changeSort(
      /Newest First|Oldest First|Name A-Z|Name Z-A|Largest First|Smallest First/
    );
    await outputs.refresh();
    await outputs.expectGalleryStable();
  });

  test('refresh preserves the same thumbnails (same filenames before and after)', async ({ page }) => {
    await page.goto('/');
    const app = new AppPageObject(page);
    await app.openAppFromSidebar();
    await app.switchToOutputs();

    const outputs = new OutputsPageObject(page);
    await outputs.expectToolbarVisible();
    await outputs.expectGalleryStable();

    const beforeThumbs = await outputs.getThumbnailCount();
    const beforeNames = await outputs.getFilenames();
    if (beforeThumbs === 0) {
      test.skip();
    }

    await outputs.refresh();
    // During refresh the gallery remains mounted
    await expect(outputs.loading).toBeVisible();
    // Accept fallback icons, but cards must not drop to zero
    const afterCardsSoon = await outputs.getCardCount();
    expect(afterCardsSoon).toBeGreaterThan(0);
    await outputs.waitForLoadingEnd();
    const afterThumbs = await outputs.getThumbnailCount();
    const afterNames = await outputs.getFilenames();
    // After refresh, the same filenames should still be displayed (order-insensitive subset check)
    const beforeSet = new Set(beforeNames);
    const afterSet = new Set(afterNames);
    for (const name of beforeSet) {
      expect(afterSet.has(name)).toBeTruthy();
    }
    expect(afterThumbs).toBeGreaterThan(0);
  });
});
