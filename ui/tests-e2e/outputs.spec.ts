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

  test('refresh does not remove already visible thumbnails', async ({ page }) => {
    await page.goto('/');
    const app = new AppPageObject(page);
    await app.openAppFromSidebar();
    await app.switchToOutputs();

    const outputs = new OutputsPageObject(page);
    await outputs.expectToolbarVisible();
    await outputs.expectGalleryStable();

    const beforeCount = await outputs.thumbnailImages.count();
    if (beforeCount === 0) {
      test.skip();
    }

    await outputs.refresh();
    // TDD: podczas odświeżania miniatury nie powinny znikać (galeria nie powinna być odmontowana)
    await expect(outputs.loading).toBeVisible();
    await expect(outputs.thumbnailImages.first()).toBeVisible({ timeout: 200 });
  });
});
