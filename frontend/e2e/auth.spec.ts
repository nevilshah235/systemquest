/**
 * E2E tests — Authentication flows
 * Covers: Register, Login, Protected route guard, Logout.
 */
import { test, expect } from '@playwright/test';

const UNIQUE_ID = Date.now();
const TEST_EMAIL = `e2e-${UNIQUE_ID}@systemquest.test`;
const TEST_USERNAME = `e2euser${UNIQUE_ID}`.slice(0, 20);
const TEST_PASSWORD = 'E2eSecure123!';

// ── Register ───────────────────────────────────────────────────────────────────────
test.describe('Registration flow', () => {
  test('user can register a new account and is redirected to dashboard', async ({ page }) => {
    await page.goto('/');

    // Navigate to register tab / form
    const registerTab = page.getByRole('tab', { name: /register/i }).or(
      page.getByText(/create account/i).first(),
    );
    if (await registerTab.isVisible()) {
      await registerTab.click();
    }

    // Fill in registration form
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/username/i).fill(TEST_USERNAME);
    // Get password field — avoid matching confirm-password
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD);

    await page.getByRole('button', { name: /register|create account|sign up/i }).click();

    // After registration, user should land on dashboard or see a mission list
    await expect(page).toHaveURL(/dashboard|missions|home/, { timeout: 10_000 });
  });

  test('registration shows an error for duplicate email', async ({ page }) => {
    await page.goto('/');

    const registerTab = page.getByRole('tab', { name: /register/i }).or(
      page.getByText(/create account/i).first(),
    );
    if (await registerTab.isVisible()) await registerTab.click();

    // Use the same email that was registered in the previous test
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/username/i).fill(`other${UNIQUE_ID}`.slice(0, 20));
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /register|create account|sign up/i }).click();

    // Should show an error message (email already in use)
    await expect(
      page.getByText(/already|taken|exists|duplicate|in use/i),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ── Login ───────────────────────────────────────────────────────────────────────────
test.describe('Login flow', () => {
  test('user can log in with valid credentials', async ({ page }) => {
    await page.goto('/');

    // Fill login form (default tab is usually login)
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^login$|^sign in$/i }).click();

    await expect(page).toHaveURL(/dashboard|missions|home/, { timeout: 10_000 });
  });

  test('login shows error for wrong password', async ({ page }) => {
    await page.goto('/');

    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/^password$/i).fill('WrongPassword999!');
    await page.getByRole('button', { name: /^login$|^sign in$/i }).click();

    await expect(
      page.getByText(/invalid|incorrect|wrong|failed|error/i),
    ).toBeVisible({ timeout: 5_000 });
    // Should remain on auth page
    await expect(page).not.toHaveURL(/dashboard/);
  });

  test('unauthenticated user is redirected to login when accessing protected route', async ({ page }) => {
    // Clear all storage to ensure no existing session
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate directly to a protected page
    await page.goto('/dashboard');

    // Should be redirected to login / auth page
    await expect(page).toHaveURL(/login|auth|\/$/, { timeout: 5_000 });
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────────
test.describe('Logout flow', () => {
  test('user can log out and is redirected to login page', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /^login$|^sign in$/i }).click();
    await expect(page).toHaveURL(/dashboard|missions|home/, { timeout: 10_000 });

    // Locate and click logout
    const logoutBtn = page
      .getByRole('button', { name: /logout|sign out/i })
      .or(page.getByText(/logout|sign out/i).first());
    await logoutBtn.click();

    // Confirm redirect to auth/login
    await expect(page).toHaveURL(/login|auth|\/$/, { timeout: 5_000 });
  });
});
