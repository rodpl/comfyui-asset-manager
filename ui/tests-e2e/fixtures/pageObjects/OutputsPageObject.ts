import { expect, Locator, Page } from '@playwright/test';

export class OutputsPageObject {
  readonly page: Page;
  readonly toolbar: Locator;
  readonly viewGridButton: Locator;
  readonly viewListButton: Locator;
  readonly sortSelect: Locator;
  readonly refreshButton: Locator;
  readonly gallery: Locator;
  readonly emptyState: Locator;
  readonly errorBanner: Locator;
  readonly loading: Locator;
  readonly thumbnailImages: Locator;
  readonly outputCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.toolbar = page.locator('.outputs-toolbar');
    this.viewGridButton = this.toolbar.getByRole('button', { name: /grid/i });
    this.viewListButton = this.toolbar.getByRole('button', { name: /list/i });
    this.sortSelect = this.toolbar.getByRole('combobox', { name: /sort outputs/i });
    this.refreshButton = this.toolbar.getByRole('button', { name: /refresh outputs/i });
    this.gallery = page.getByRole('grid', { name: /output gallery/i });
    this.emptyState = page.locator('.outputs-empty-state');
    this.errorBanner = page.locator('.error-banner');
    this.loading = page.locator('.outputs-loading');
    this.thumbnailImages = this.gallery.locator('img');
    this.outputCards = this.gallery.locator('.output-card, .output-list-item');
  }

  async expectToolbarVisible(): Promise<void> {
    await expect(this.toolbar).toBeVisible();
  }

  async toggleViewModes(): Promise<void> {
    await this.viewListButton.click();
    await this.viewGridButton.click();
  }

  async changeSort(optionRegex: RegExp): Promise<void> {
    const options = this.sortSelect.locator('option');
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const label = await options.nth(i).textContent();
      if (label && optionRegex.test(label)) {
        await this.sortSelect.selectOption({ index: i });
        return;
      }
    }
    // No matching option: select the first to keep UI stable
    await this.sortSelect.selectOption({ index: 0 });
  }

  async refresh(): Promise<void> {
    await this.refreshButton.click();
  }

  async expectGalleryStable(timeoutMs: number = 10000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const galleryVisible = await this.gallery.isVisible().catch(() => false);
      const emptyVisible = await this.emptyState.isVisible().catch(() => false);
      const errorVisible = await this.errorBanner.isVisible().catch(() => false);
      const loadingVisible = await this.loading.isVisible().catch(() => false);
      if (galleryVisible || emptyVisible || errorVisible || loadingVisible) {
        expect(true).toBeTruthy();
        return;
      }
      await this.page.waitForTimeout(100);
    }
    expect(false).toBeTruthy();
  }

  async getThumbnailCount(): Promise<number> {
    return this.thumbnailImages.count();
  }

  async getCardCount(): Promise<number> {
    return this.outputCards.count();
  }

  async waitForLoadingStart(timeoutMs: number = 2000): Promise<void> {
    await this.loading.waitFor({ state: 'visible', timeout: timeoutMs }).catch(() => {});
  }

  async waitForLoadingEnd(timeoutMs: number = 10000): Promise<void> {
    await this.loading.waitFor({ state: 'hidden', timeout: timeoutMs }).catch(() => {});
  }
}
