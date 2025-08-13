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

    const beforeThumbs = await outputs.getThumbnailCount();
    if (beforeThumbs === 0) {
      test.skip();
    }

    await outputs.refresh();
    // TDD: podczas odświeżania miniatury nie powinny znikać (galeria nie powinna być odmontowana)
    await expect(outputs.loading).toBeVisible();
    // Dopuszczamy fallback ikonę, ale karty nie mogą spaść do zera
    const afterCardsSoon = await outputs.getCardCount();
    expect(afterCardsSoon).toBeGreaterThan(0);
    await outputs.waitForLoadingEnd();
    const afterThumbs = await outputs.getThumbnailCount();
    // Po zakończeniu ładowania miniatury powinny być znów widoczne przynajmniej częściowo
    expect(afterThumbs).toBeGreaterThan(0);
  });
});
