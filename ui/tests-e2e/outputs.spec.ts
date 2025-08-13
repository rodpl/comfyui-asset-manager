import { test } from '@playwright/test';
import { AppPageObject } from './fixtures/pageObjects/app.po';
import { OutputsPageObject } from './fixtures/pageObjects/outputs.po';

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
});
