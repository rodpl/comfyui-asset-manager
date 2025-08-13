import type { FullConfig } from '@playwright/test';

async function waitForServer(url: string, timeoutMs: number = 30_000): Promise<void> {
  const start = Date.now();
  // Prefer HEAD to avoid loading the whole page
  while (Date.now() - start < timeoutMs) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3_000);
      const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
      clearTimeout(id);
      if (res.ok || res.status === 405 || res.status === 404) {
        // 405/404 still proves that the server is up and responding
        return;
      }
    } catch {
      // Swallow and retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} not reachable within ${timeoutMs}ms`);
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL as string | undefined;
  const url = baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8188';
  // Hit a stable public resource; root should exist on ComfyUI
  await waitForServer(url);
}
