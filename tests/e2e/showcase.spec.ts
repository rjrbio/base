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
    await expect(page.getByRole('heading', { name: 'GonnaBe' })).toBeVisible();
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

  test('renders 11 project images and 1 remaining placeholder for status', async ({ page }) => {
    // Lore (3) + Mando (3) + Kintsugi (5) = 11 images integrated
    await expect(page.locator('img.project-image')).toHaveCount(11);
    // Only the Kintsugi "status" sub-section keeps the placeholder
    await expect(page.locator('.asset-placeholder')).toHaveCount(1);
  });

  test('every project image carries a meaningful alt text', async ({ page }) => {
    const images = page.locator('img.project-image');
    const count = await images.count();
    expect(count).toBe(11);
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `image #${i} should have alt`).toBeTruthy();
      expect((alt ?? '').length, `image #${i} alt too short`).toBeGreaterThan(10);
    }
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
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('audio toggle is rendered, sticky and ready to play', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('[data-audio-toggle]');
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await expect(button).toHaveAttribute('aria-label', /play ambient audio/i);
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    const position = await button.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('mounts a webgl background canvas behind the content', async ({ page }) => {
    const canvas = page.locator('[data-background-canvas]');
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    const z = await canvas.evaluate((el) => getComputedStyle(el).zIndex);
    expect(z).toBe('-1');
  });

  test('scrolls from hero to footer without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (/Failed to load resource.*404/i.test(text)) return;
      errors.push(text);
    });

    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    await expect(page.getByRole('contentinfo')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test('background pixels change visibly between scroll positions', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  const probe = { x: 40, y: 40, width: 360, height: 360 };

  const top = await page.screenshot({ clip: probe });

  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight * 0.5);
  });
  await page.waitForTimeout(900);
  const middle = await page.screenshot({ clip: probe });

  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await page.waitForTimeout(900);
  const bottom = await page.screenshot({ clip: probe });

  // The shader is scroll-driven: pixels in the top-left probe area must
  // differ between the three scroll positions (otherwise the link scroll
  // -> uProgress -> shader is broken).
  expect(top.equals(middle), 'top vs middle should differ').toBe(false);
  expect(middle.equals(bottom), 'middle vs bottom should differ').toBe(false);
  expect(top.equals(bottom), 'top vs bottom should differ').toBe(false);
});

test('renders all sections statically with prefers-reduced-motion', async ({ browser }) => {
  const ctx = await browser.newContext({
    reducedMotion: 'reduce',
    baseURL: 'http://localhost:4321',
  });
  const page = await ctx.newPage();
  try {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('BUILT FROM CURIOSITY.');
    await expect(page.getByRole('heading', { name: 'Lore Master Assistant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Kintsugi: The Fall' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  } finally {
    await ctx.close();
  }
});

test('scroll progress indicator exists and is hidden from the a11y tree', async ({ page }) => {
  await page.goto('/');
  const progress = page.locator('[data-scroll-progress]');
  await expect(progress).toHaveCount(1);
  await expect(progress).toHaveAttribute('aria-hidden', 'true');
});

test('background canvas reports active particles on desktop', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const flag = await page.locator('[data-background-canvas]').getAttribute('data-particles');
  expect(Number(flag)).toBeGreaterThan(0);
});

test('reduced motion disables the particle layer', async ({ browser }) => {
  const ctx = await browser.newContext({
    reducedMotion: 'reduce',
    baseURL: 'http://localhost:4321',
  });
  const page = await ctx.newPage();
  try {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const flag = await page.locator('[data-background-canvas]').getAttribute('data-particles');
    expect(flag).toBeNull();
  } finally {
    await ctx.close();
  }
});

test('kintsugi title settles fully readable after its glitch reveal', async ({ page }) => {
  await page.goto('/');
  await page.locator('#kintsugi-the-fall').scrollIntoViewIfNeeded();
  await page.waitForTimeout(3000);
  const title = page.locator('#kintsugi-the-fall .project__title');
  await expect(title).toBeVisible();
  await expect(title).toHaveAttribute('aria-label', 'Kintsugi: The Fall');
});
