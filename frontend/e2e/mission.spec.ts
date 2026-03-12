/**
 * E2E tests — Mission flow
 * Covers: Dashboard loads missions, user enters a mission, submits architecture.
 * These tests assume a logged-in session (storage state reuse or fresh login).
 */
import { test, expect } from '@playwright/test';

const UNIQUE_ID = Date.now();
const TEST_EMAIL = `mission-e2e-${UNIQUE_ID}@systemquest.test`;
const TEST_USERNAME = `mplayer${UNIQUE_ID}`.slice(0, 20);
const TEST_PASSWORD = 'E2eSecure123!';

// Helper: register + login and return the page in an authenticated state
async function loginAs(page: import('@playwright/test').Page) {
  await page.goto('/');
  const registerTab = page
    .getByRole('tab', { name: /register/i })
    .or(page.getByText(/create account/i).first());
  if (await registerTab.isVisible()) await registerTab.click();

  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/username/i).fill(TEST_USERNAME);
  await page.getByLabel(/^password$/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /register|create account|sign up/i }).click();
  await expect(page).toHaveURL(/dashboard|missions|home/, { timeout: 10_000 });
}

// ── Dashboard ───────────────────────────────────────────────────────────────────
test.describe('Dashboard — mission list', () => {
  test('dashboard renders at least one mission card after login', async ({ page }) => {
    await loginAs(page);

    // Dashboard should show mission cards
    const missionCards = page.locator('[data-testid="mission-card"]').or(
      page.locator('.mission-card, [class*="MissionCard"], [class*="mission"]'),
    );
    await expect(missionCards.first()).toBeVisible({ timeout: 8_000 });
  });

  test('dashboard shows XP / level indicator', async ({ page }) => {
    await loginAs(page);

    const xpIndicator = page
      .getByText(/xp|level|experience/i)
      .first();
    await expect(xpIndicator).toBeVisible({ timeout: 5_000 });
  });
});

// ── Mission page ─────────────────────────────────────────────────────────────────────
test.describe('Mission page — open and view', () => {
  test('user can open the first available (unlocked) mission', async ({ page }) => {
    await loginAs(page);

    // Click the first non-locked mission
    const firstMission = page
      .locator('[data-testid="mission-card"]:not([data-locked="true"])')
      .or(page.locator('[class*="mission"]:not([class*="locked"])').first());

    await firstMission.first().click();

    // Should navigate to mission page
    await expect(page).toHaveURL(/mission/, { timeout: 8_000 });
  });

  test('mission page shows the mission briefing / scenario', async ({ page }) => {
    await loginAs(page);

    // Navigate to first mission via URL pattern
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="mission-card"], [class*="mission"]', { timeout: 8_000 });

    const firstLink = page.getByRole('link', { name: /mission|launch|start/i }).first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
    } else {
      // Fallback: click the first mission card
      await page.locator('[class*="mission"]').first().click();
    }

    await expect(page).toHaveURL(/mission/, { timeout: 8_000 });

    // Mission page should show some description text
    const contentArea = page.locator('main, [role="main"], .container').first();
    await expect(contentArea).not.toBeEmpty();
  });
});

// ── Architecture builder ───────────────────────────────────────────────────────────
test.describe('Architecture builder', () => {
  test('Run Simulation button is visible on the mission / builder page', async ({ page }) => {
    await loginAs(page);
    await page.goto('/dashboard');
    await page.waitForSelector('[class*="mission"]', { timeout: 8_000 });
    await page.locator('[class*="mission"]').first().click();
    await expect(page).toHaveURL(/mission/, { timeout: 8_000 });

    // The simulate / run button should be somewhere on the mission page
    const runBtn = page
      .getByRole('button', { name: /simulate|run|submit|check/i })
      .first();
    await expect(runBtn).toBeVisible({ timeout: 8_000 });
  });
});
