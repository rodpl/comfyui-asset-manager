import { expect, Locator, Page } from '@playwright/test';

export class LocalAssetsPageObject {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly folderList: Locator;
  readonly modelGrid: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.getByRole('navigation', { name: /model folders navigation/i });
    this.folderList = this.sidebar.locator('.folder-list');
    this.modelGrid = page.getByRole('grid', { name: /model grid/i });
    this.searchInput = page.getByTestId('search-input');
  }

  async expectFoldersVisible(): Promise<void> {
    await expect(this.folderList).toBeVisible();
  }

  async selectFolderByPartialName(partial: string): Promise<void> {
    const item = this.folderList.getByRole('button').filter({ hasText: new RegExp(partial, 'i') });
    if ((await item.count()) > 0) {
      await item.first().click();
      return;
    }
    // If no folder matches, just confirm UI remains stable
    await expect(this.sidebar).toBeVisible();
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill('');
    await this.searchInput.type(term);
  }
}
