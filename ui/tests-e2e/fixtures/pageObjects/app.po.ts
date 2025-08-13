import { expect, Locator, Page } from '@playwright/test';
import { TestIds } from '../test-ids';

export class AppPageObject {
  readonly page: Page;
  readonly sidebarTabButton: Locator;
  readonly tabList: Locator;
  readonly tabButtonLocal: Locator;
  readonly tabButtonBrowse: Locator;
  readonly tabButtonOutputs: Locator;

  constructor(page: Page) {
    this.page = page;
    // ComfyUI main tab button injected by extension (registered in main.tsx)
    this.sidebarTabButton = page.getByRole('button', { name: /asset manager/i }).first();
    // Inside our React app
    this.tabList = page.getByTestId(TestIds.tablist);
    this.tabButtonLocal = page.getByTestId(TestIds.tabs.local);
    this.tabButtonBrowse = page.getByTestId(TestIds.tabs.browse);
    this.tabButtonOutputs = page.getByTestId(TestIds.tabs.outputs);
  }

  async openAppFromSidebar(): Promise<void> {
    // If the app is already rendered, skip clicking sidebar
    const alreadyMounted = await this.page.locator('#comfyui-asset-manager-root').count();
    if (alreadyMounted > 0) {
        return;
    }
    // The extension registers a sidebar tab with title 'Asset Manager'
    await this.sidebarTabButton.click({ trial: true }).catch(() => {});
    await this.sidebarTabButton.click();
    await expect(this.page.locator('#comfyui-asset-manager-root')).toBeVisible();
  }

  async switchToLocalAssets(): Promise<void> {
    await this.tabButtonLocal.click();
    await expect(this.page.locator('#tabpanel-local')).toBeVisible();
  }

  async switchToModelBrowser(): Promise<void> {
    await this.tabButtonBrowse.click();
    await expect(this.page.locator('#tabpanel-browse')).toBeVisible();
  }

  async switchToOutputs(): Promise<void> {
    await this.tabButtonOutputs.click();
    await expect(this.page.locator('#tabpanel-outputs')).toBeVisible();
  }
}
