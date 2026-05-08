import { test, expect } from '@playwright/test';

test.describe('Projects Showcase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero with the headline', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('BUILT FROM CURIOSITY.');
  });

  test('shows the three project headings', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Lore Master Assistant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Rule The Mando' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kintsugi: The Fall' })).toBeVisible();
  });

  test('CTA links to the portfolio in a new tab', async ({ page }) => {
    const cta = page.getByRole('link', { name: /see more work/i });
    await expect(cta).toHaveAttribute('href', 'https://jdev.alwaysdata.net');
    await expect(cta).toHaveAttribute('target', '_blank');
    await expect(cta).toHaveAttribute('rel', /noopener/);
  });

  test('footer attributes authorship to rjrbio with GitHub link', async ({ page }) => {
    const footerLink = page.getByRole('contentinfo').getByRole('link', { name: 'rjrbio' });
    await expect(footerLink).toHaveAttribute('href', 'https://github.com/rjrbio');
    await expect(footerLink).toHaveAttribute('target', '_blank');
    await expect(footerLink).toHaveAttribute('rel', /noopener/);
  });

  test('does NOT contain a contact section, forms, or social profiles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /^contact$/i })).toHaveCount(0);
    await expect(page.locator('form')).toHaveCount(0);
    const body = (await page.locator('body').textContent()) ?? '';
    expect(body).not.toMatch(/twitter|linkedin|instagram|facebook/i);
  });

  test('has exactly one h1 and four h2 (3 projects + CTA)', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h2')).toHaveCount(4);
  });

  test('renders 12 asset placeholders (3 + 3 + 6 sub-sections)', async ({ page }) => {
    await expect(page.locator('.asset-placeholder')).toHaveCount(12);
  });

  test('every sub-section exposes a data-pinning-id (anchor for phase 4)', async ({ page }) => {
    const subsections = page.locator('[data-pinning-id]');
    await expect(subsections).toHaveCount(12);
  });

  test('keyboard navigation reaches the CTA and the footer link', async ({ page }) => {
    await page.keyboard.press('Tab');
    const reachable: string[] = [];
    for (let i = 0; i < 30; i++) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        return el.getAttribute('href') ?? el.tagName;
      });
      if (focused) reachable.push(focused);
      await page.keyboard.press('Tab');
    }
    expect(reachable).toContain('https://jdev.alwaysdata.net');
    expect(reachable).toContain('https://github.com/rjrbio');
  });

  test('logs no console errors after navigationIdle', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });
});
