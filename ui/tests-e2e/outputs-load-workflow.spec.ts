import { test, expect } from '@playwright/test';
import { AppPageObject } from './fixtures/pageObjects/AppPageObject';
import { OutputsPageObject } from './fixtures/pageObjects/OutputsPageObject';

test.describe('Outputs - Load Workflow applies to canvas', () => {
  test('picks a random output with workflow, loads it, and matches parameters', async ({ page }) => {
    await page.goto('/');

    const app = new AppPageObject(page);
    await app.openAppFromSidebar();
    await app.switchToOutputs();

    const outputs = new OutputsPageObject(page);
    await outputs.expectToolbarVisible();

    // Pick a random candidate that has workflow metadata and preferably positive prompt
    const selection = await page.evaluate(async () => {
      const res = await fetch('/asset_manager/outputs?sort_by=date&ascending=false');
      const j = await res.json();
      const arr = Array.isArray(j?.data) ? j.data : [];
      const candidates = arr
        .filter((o: any) => o?.workflow_metadata?.workflow)
        .map((o: any) => ({ id: o.id, filename: o.filename }));
      if (candidates.length === 0) return null;
      const idx = Math.floor(Math.random() * candidates.length);
      const picked = candidates[idx];
      const det = await fetch(`/asset_manager/outputs/${picked.id}`).then(r => r.json()).catch(() => null);
      const data = det?.data || {};
      const wm = data?.workflow_metadata || {};
      return {
        id: picked.id as string,
        filename: picked.filename as string,
        meta: {
          positive_prompt: wm.positive_prompt ?? null,
          negative_prompt: wm.negative_prompt ?? null,
          model: wm.model ?? null,
          steps: wm.steps ?? null,
          cfg: (wm as any).cfg ?? (wm as any).cfg_scale ?? null,
          sampler: wm.sampler ?? (wm as any).sampler_name ?? null,
          scheduler: wm.scheduler ?? null,
          seed: wm.seed ?? null,
        },
      };
    });

    if (!selection) { test.skip(); return null as any; }

    const sel: { id: string; filename: string; meta: { positive_prompt: string|null; negative_prompt: string|null; model: string|null; steps: any; cfg: any; sampler: any; scheduler: any; seed: any; } } = selection;

    // Open the selected thumbnail by filename
    await page.getByRole('img', { name: sel.filename }).first().click();

    // Click Load Workflow and confirm
    const loadBtn = page.getByRole('button', { name: /load workflow/i }).first();
    await loadBtn.click();
    await page.getByRole('button', { name: /^load workflow$/i }).click();

    // Wait for success feedback to ensure backend call finished and UI injection attempted
    await page.getByText(/workflow loaded successfully/i).first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    // Give the canvas a bit of time to apply graph and widget changes
    await page.waitForTimeout(300);

    // Read values from the canvas and compare against metadata
    const canvas = await page.evaluate(async (id: string) => {
      const w: any = window as any;
      const getApp = () => w.app || w.App || (w.comfy && w.comfy.app) || w.comfyApp || (w.COMFY && w.COMFY.app);
      const app = getApp();
      const graph = (app && (app.graph || (app.canvas && app.canvas.graph))) || (w as any).graph;
      const nodes: any[] = (graph && (graph.nodes || graph._nodes)) || [];
      const lname = (s: any) => String(s || '').toLowerCase();

      const clipTexts: string[] = [];
      for (const n of nodes) {
        if (lname(n?.type) === 'cliptextencode') {
          let val: any = undefined;
          if (Array.isArray(n.widgets)) {
            const wgt = n.widgets.find((w: any) => lname(w?.name) === 'text');
            if (wgt) val = wgt.value;
          }
          if (val === undefined && Array.isArray(n.widgets_values) && n.widgets_values.length) {
            val = n.widgets_values[0];
          }
          if (typeof val === 'string') clipTexts.push(val);
        }
      }

      const ksamplers: any[] = nodes.filter(n => lname(n?.type) === 'ksampler');
      const kValues = ksamplers.map(n => {
        const get = (names: string[]): any => {
          if (Array.isArray(n.widgets)) {
            for (const wgt of n.widgets) {
              if (names.map(lname).includes(lname(wgt?.name))) return wgt.value;
            }
          }
          return undefined;
        };
        return {
          seed: get(['seed']),
          steps: get(['steps']),
          cfg: get(['cfg', 'cfg_scale']),
          sampler: get(['sampler', 'sampler_name']),
          scheduler: get(['scheduler'])
        };
      });

      const ckpts: any[] = nodes.filter(n => lname(n?.type) === 'checkpointloadersimple');
      const ckptNames = ckpts.map(n => {
        if (Array.isArray(n.widgets)) {
          for (const wgt of n.widgets) {
            if (['ckpt_name', 'model', 'checkpoint'].includes(lname(wgt?.name))) return wgt.value;
          }
        }
        return undefined;
      }).filter(Boolean);

      const det = await fetch(`/asset_manager/outputs/${id}`).then(r => r.json()).catch(() => null);
      const wm = (det && det.data && det.data.workflow_metadata) || {};
      return { clipTexts, kValues, ckptNames, meta: wm };
    }, sel.id);

    // Positive prompt should appear in one of CLIPTextEncode nodes
    if (sel.meta.positive_prompt) {
      const snippet = String(sel.meta.positive_prompt).slice(0, Math.min(60, String(sel.meta.positive_prompt).length));
      // Poll up to ~3s for prompt to appear in canvas to reduce flakiness across browsers
      let matched = canvas.clipTexts.some((t: string) => t.includes(snippet));
      if (!matched) {
        for (let i = 0; i < 10; i++) {
          await page.waitForTimeout(300);
          const again = await page.evaluate(async (arg: { snip: string }) => {
            const w: any = window as any;
            const getApp = () => w.app || w.App || (w.comfy && w.comfy.app) || w.comfyApp || (w.COMFY && w.COMFY.app);
            const app = getApp();
            const graph = (app && (app.graph || (app.canvas && app.canvas.graph))) || (w as any).graph;
            const nodes: any[] = (graph && (graph.nodes || graph._nodes)) || [];
            const lname = (s: any) => String(s || '').toLowerCase();
            const clipTexts: string[] = [];
            for (const n of nodes) {
              if (lname(n?.type) === 'cliptextencode') {
                let val: any = undefined;
                if (Array.isArray(n.widgets)) {
                  const wgt = n.widgets.find((w: any) => lname(w?.name) === 'text');
                  if (wgt) val = wgt.value;
                }
                if (val === undefined && Array.isArray(n.widgets_values) && n.widgets_values.length) {
                  val = n.widgets_values[0];
                }
                if (typeof val === 'string') clipTexts.push(val);
              }
            }
            return clipTexts.some((t: string) => t.includes(arg.snip));
          }, { snip: snippet });
          if (again) { matched = true; break; }
        }
      }
      expect(matched).toBeTruthy();
    }

    // Negative prompt (if available) should appear as well
    if (sel.meta.negative_prompt) {
      const snippet = String(sel.meta.negative_prompt).slice(0, Math.min(60, String(sel.meta.negative_prompt).length));
      expect.soft(canvas.clipTexts.some((t: string) => t.includes(snippet))).toBeTruthy();
    }

    // KSampler parameters (best-effort; only validate when present in metadata)
    const someK = (pred: (v: any) => boolean) => Array.isArray(canvas.kValues) && canvas.kValues.some(pred);
    if (sel.meta.seed != null) {
      expect.soft(someK((v) => String(v.seed) === String(sel.meta.seed))).toBeTruthy();
    }
    if (sel.meta.steps != null) {
      expect.soft(someK((v) => String(v.steps) === String(sel.meta.steps))).toBeTruthy();
    }
    if (sel.meta.cfg != null) {
      expect.soft(someK((v) => String(v.cfg) === String(sel.meta.cfg))).toBeTruthy();
    }
    if (sel.meta.sampler != null) {
      expect.soft(someK((v) => String(v.sampler) === String(sel.meta.sampler))).toBeTruthy();
    }
    if (sel.meta.scheduler != null) {
      expect.soft(someK((v) => String(v.scheduler) === String(sel.meta.scheduler))).toBeTruthy();
    }

    // Model checkpoint (if available in metadata)
    if (sel.meta.model) {
      const model = String(sel.meta.model);
      const anyCkptMatches = Array.isArray(canvas.ckptNames) && canvas.ckptNames.some((n: string) => String(n).includes(model));
      expect.soft(anyCkptMatches).toBeTruthy();
    }
  });
});


