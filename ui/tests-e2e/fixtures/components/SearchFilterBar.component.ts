import { expect, Page } from '@playwright/test';

export class SearchFilterBarComponentObject {
  constructor(private readonly page: Page) {}

  get searchInput() {
    return this.page.getByTestId('search-input');
  }

  async search(term: string) {
    await this.searchInput.fill('');
    await this.searchInput.type(term);
    await expect(this.searchInput).toHaveValue(term);
  }
}


