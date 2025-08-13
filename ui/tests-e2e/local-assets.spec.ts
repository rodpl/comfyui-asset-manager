import { test } from '@playwright/test';
import { AppPageObject } from './fixtures/pageObjects/app.po';
import { LocalAssetsPageObject } from './fixtures/pageObjects/local-assets.po';
import { SearchFilterBarComponentObject } from './fixtures/components/SearchFilterBar.component';

test.describe('Local Assets tab - resilient interactions', () => {
  test('can open tab, see folder list and search without relying on fixed data', async ({
    page,
  }) => {
    await page.goto('/');
    const app = new AppPageObject(page);
    await app.openAppFromSidebar();
    await app.switchToLocalAssets();

    const local = new LocalAssetsPageObject(page);
    await local.expectFoldersVisible();
    await local.selectFolderByPartialName('check');
    const searchBar = new SearchFilterBarComponentObject(page);
    await searchBar.search('test');
  });
});
