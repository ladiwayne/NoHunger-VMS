const { chromium } = require('playwright');

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

async function run() {
  const results = [];
  const adminCreds = await createAdmin();

  const browser = await chromium.launch({ headless: true });

  try {
    // Flow 1: signup -> onboarding validation -> dashboard redirect
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      const volunteerEmail = nowId('vol.smoke');
      const volunteerPassword = 'TempVol@2026';

      try {
        await page.goto(`${FRONTEND_URL}/sign-up-login-screen`, { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: 'Create Account' }).click();

        await page.getByPlaceholder('Chidi').fill('Flow');
        await page.getByPlaceholder('Mensah').fill('Volunteer');
        await page.getByPlaceholder('you@example.com').fill(volunteerEmail);
        await page.getByPlaceholder('+1 (555) 000-0000').fill('+2348012345678');
        await page.locator('select').nth(0).selectOption({ label: 'Lagos' });

        // Select one skill
        await page.getByRole('button', { name: /Food Packing/i }).click();

        await page.getByPlaceholder('Min. 8 characters').fill(volunteerPassword);
        await page.getByPlaceholder('Repeat password').fill(volunteerPassword);
        await page.locator('#agreeTerms').check();
        await page.getByRole('button', { name: 'Create Account' }).click();

        await page.waitForURL(/\/onboarding/, { timeout: 20000 });

        // Welcome -> Profile
        await page.getByRole('button', { name: 'Get Started' }).click();

        // Trigger required validation
        await page.getByRole('button', { name: 'Continue' }).click();

        await page.waitForSelector('text=Please select your gender', { timeout: 5000 });
        await page.waitForSelector('text=Please select a state', { timeout: 5000 });

        // Fill required profile fields
        await page.getByPlaceholder('123 Main Street').fill('12 Allen Avenue');
        await page.getByPlaceholder('New York').fill('Ikeja');

        const profileSelects = page.locator('select');
        // Gender select then state select in onboarding profile form
        await profileSelects.nth(0).selectOption('female');
        await profileSelects.nth(1).selectOption('Lagos');

        // Fill/overwrite phone
        const phoneInput = page.getByPlaceholder('+234 (0) 800 000 0000').first();
        await phoneInput.fill('+2348012345678');

        await page.getByRole('button', { name: 'M' }).click();
        await page.getByPlaceholder('Tell us what motivates you to volunteer and what you hope to contribute...').fill('I want to support food access in my community.');

        await page.getByRole('button', { name: 'Continue' }).click();

        // Skills step
        await page.getByRole('button', { name: /Food Packing/i }).first().click();
        await page.getByRole('button', { name: /Submit Profile/i }).click();

        await page.waitForURL(/\/volunteer-dashboard/, { timeout: 20000 });

        results.push({ flow: 'signup-onboarding-dashboard', status: 'PASS' });
      } catch (error) {
        await page.screenshot({ path: 'smoke-flow1-fail.png', fullPage: true });
        results.push({ flow: 'signup-onboarding-dashboard', status: 'FAIL', error: String(error) });
      } finally {
        await context.close();
      }
    }

    // Flow 2 + 3: admin volunteers grouping cards + bulk message from audience selector
    {
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await page.goto(`${FRONTEND_URL}/sign-up-login-screen`, { waitUntil: 'networkidle' });

        await page.getByPlaceholder('you@example.com').first().fill(adminCreds.email);
        await page.getByPlaceholder('••••••••').first().fill(adminCreds.password);
        await page.getByRole('button', { name: 'Sign In' }).click();

        await page.waitForURL(/\/admin\/dashboard/, { timeout: 20000 });
        await page.goto(`${FRONTEND_URL}/admin/volunteers`, { waitUntil: 'networkidle' });

        await page.waitForSelector('text=By Gender', { timeout: 10000 });
        await page.waitForSelector('text=By Event Confirmation', { timeout: 10000 });
        await page.waitForSelector('text=Top Locations', { timeout: 10000 });

        results.push({ flow: 'admin-volunteers-grouping-cards', status: 'PASS' });

        // Bulk message flow
        await page.getByRole('button', { name: 'Send Message' }).click();
        await page.locator('select').first().selectOption('all');
        await page.getByPlaceholder('Write your message to this volunteer…').fill('Smoke bulk message test');
        await page.getByRole('button', { name: 'Send Message' }).click();

        await page.waitForSelector('text=Bulk message sent to', { timeout: 10000 });
        results.push({ flow: 'bulk-message-audience-selector', status: 'PASS' });
      } catch (error) {
        await page.screenshot({ path: 'smoke-flow23-fail.png', fullPage: true });
        if (!results.find((r) => r.flow === 'admin-volunteers-grouping-cards')) {
          results.push({ flow: 'admin-volunteers-grouping-cards', status: 'FAIL', error: String(error) });
        }
        if (!results.find((r) => r.flow === 'bulk-message-audience-selector')) {
          results.push({ flow: 'bulk-message-audience-selector', status: 'FAIL', error: String(error) });
        }
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  for (const r of results) {
    if (r.status === 'PASS') {
      console.log(`PASS ${r.flow}`);
    } else {
      console.log(`FAIL ${r.flow} :: ${r.error}`);
    }
  }

  const failed = results.some((r) => r.status === 'FAIL');
  process.exit(failed ? 1 : 0);
}

run().catch((e) => {
  console.error(`FATAL ${String(e)}`);
  process.exit(1);
});
