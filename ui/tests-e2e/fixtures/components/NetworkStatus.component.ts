import { expect, Page } from '@playwright/test';

export class NetworkStatusComponentObject {
  constructor(private readonly page: Page) {}

  get container() {
    return this.page.locator('.network-status');
  }

  async expectOfflineBannerVisible() {
    await this.page.waitForTimeout(50);
    await expect(this.container).toHaveClass(/offline/);
  }

  async expectBackOnlineAutoHides(timeoutMs: number = 4000) {
    const online = this.container.filter({ has: this.page.locator('.online') });
    await expect(online).toBeVisible();
    await this.page.waitForTimeout(timeoutMs);
    await expect(online).toBeHidden();
  }
}


