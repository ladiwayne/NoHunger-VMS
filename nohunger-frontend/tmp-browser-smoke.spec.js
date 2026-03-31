const { test, expect } = require('@playwright/test');

const FRONTEND_URL = 'http://localhost:4028';
const BACKEND_URL = 'http://localhost:5000/api';

function nowId(prefix) {
  return `${prefix}.${Date.now()}@nohunger.org`;
}

async function createAdmin() {
  const email = nowId('admin.smoke');
  const password = 'TempAdmin@2026';

  const response = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Smoke',
      lastName: 'Admin',
      email,
      password,
      role: 'admin',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Admin creation failed: ${response.status} ${body}`);
  }

  return { email, password };
}

test.describe.configure({ mode: 'serial' });

test('signup -> onboarding required gender/state -> dashboard redirect', async ({ page }) => {
  const volunteerEmail = nowId('vol.smoke');
  const volunteerPassword = 'TempVol@2026';

  await page.goto(`${FRONTEND_URL}/sign-up-login-screen`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Create Account' }).click();

  await page.getByPlaceholder('Chidi').fill('Flow');
  await page.getByPlaceholder('Mensah').fill('Volunteer');
  await page.getByPlaceholder('you@example.com').fill(volunteerEmail);
  await page.getByPlaceholder('+1 (555) 000-0000').fill('+2348012345678');
  await page.locator('select').nth(0).selectOption({ label: 'Lagos' });

  await page.getByRole('button', { name: /Food Packing/i }).click();

  await page.getByPlaceholder('Min. 8 characters').fill(volunteerPassword);
  await page.getByPlaceholder('Repeat password').fill(volunteerPassword);
  await page.locator('#agreeTerms').check();
  await page.getByRole('button', { name: 'Create Account' }).click();

  await page.waitForURL(/\/onboarding/, { timeout: 20000 });
  await page.getByRole('button', { name: 'Get Started' }).click();

  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Please select your gender')).toBeVisible();
  await expect(page.getByText('Please select a state')).toBeVisible();

  await page.getByPlaceholder('123 Main Street').fill('12 Allen Avenue');
  await page.getByPlaceholder('New York').fill('Ikeja');

  const profileSelects = page.locator('select');
  await profileSelects.nth(0).selectOption('female');
  await profileSelects.nth(1).selectOption('Lagos');

  await page.getByPlaceholder('+234 (0) 800 000 0000').first().fill('+2348012345678');
  await page.getByRole('button', { name: 'M' }).click();
  await page
    .getByPlaceholder('Tell us what motivates you to volunteer and what you hope to contribute...')
    .fill('I want to support food access in my community.');

  await page.getByRole('button', { name: 'Continue' }).click();

  await page.getByRole('button', { name: /Food Packing/i }).first().click();
  await page.getByRole('button', { name: /Submit Profile/i }).click();

  await page.waitForURL(/\/volunteer-dashboard/, { timeout: 20000 });
});

test('admin volunteers grouping cards visibility', async ({ page }) => {
  const adminCreds = await createAdmin();

  await page.goto(`${FRONTEND_URL}/sign-up-login-screen`, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('you@example.com').first().fill(adminCreds.email);
  await page.getByPlaceholder('••••••••').first().fill(adminCreds.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20000 });
  await page.goto(`${FRONTEND_URL}/admin/volunteers`, { waitUntil: 'networkidle' });

  await expect(page.getByText('By Gender')).toBeVisible();
  await expect(page.getByText('By Event Confirmation')).toBeVisible();
  await expect(page.getByText('Top Locations')).toBeVisible();
});

test('bulk message send from audience selector', async ({ page }) => {
  const adminCreds = await createAdmin();

  await page.goto(`${FRONTEND_URL}/sign-up-login-screen`, { waitUntil: 'networkidle' });
  await page.getByPlaceholder('you@example.com').first().fill(adminCreds.email);
  await page.getByPlaceholder('••••••••').first().fill(adminCreds.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await page.waitForURL(/\/admin\/dashboard/, { timeout: 20000 });
  await page.goto(`${FRONTEND_URL}/admin/volunteers`, { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'Send Message' }).click();
  await page.locator('select').first().selectOption('all');
  await page.getByPlaceholder('Write your message to this volunteer…').fill('Smoke bulk message test');
  await page.getByRole('button', { name: 'Send Message' }).click();

  await expect(page.getByText('Bulk message sent to')).toBeVisible({ timeout: 10000 });
});
