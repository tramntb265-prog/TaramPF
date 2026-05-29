import { test as base, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import fs from 'fs';

const authFile = 'PFauth.json';
const dashboardUrl = 'https://dev.flexigrow.app';

type PFFixtures = {
    page: Page;
};

export const test = base.extend<PFFixtures>({
    page: async ({ browser }, use) => {
        // 1. Create a pristine context using the stored state
        const context = await browser.newContext({
            storageState: fs.existsSync(authFile) ? authFile : undefined
        });
        
        // 2. Open the ACTUAL page that the test will use
        const page = await context.newPage();

        // 3. Validate or log in on this specific page instance
        await handleSessionLifecycle(page);

        // 4. Pass the authenticated page directly to the test
        await use(page);

        // 5. Clean up after the test completes
        await page.close();
        await context.close();
    }, 
});

export { expect };

async function handleSessionLifecycle(page: Page): Promise<void> {
    // If the file exists, attempt to reuse it right on this page
    if (fs.existsSync(authFile)) {
        try {
            console.log('🔄 Verifying existing session directly on test tab...');
            await page.goto(dashboardUrl, { waitUntil: 'domcontentloaded' });

            // Race to verify location
            const destination = await Promise.race([
                page.waitForURL(/.*\/dashboards.*/, { timeout: 8000 }).then(() => 'dashboard'),
                page.waitForURL(/.*\/login.*/, { timeout: 8000 }).then(() => 'login'),
            ]);

            if (destination === 'login') {
                throw new Error('Redirected to login. Session is stale.');
            }
            
            console.log('✅ Token refresh check passed successfully!');
            // Save potential silent refreshes back to your file
            await page.context().storageState({ path: authFile });
            return; // Session is perfect! Stop executing here.

        } catch (error) {
            console.log('❌ Session validation failed. Clearing state for retry...');
            await page.context().clearCookies();
        }
    }

    // FALLBACK: If file doesn't exist OR verification threw an error
    console.log('🔐 Session empty or broken. Launching manual login layout...');
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill('testy131@yopmail.com');
    await loginPage.signInButton.click();
    await loginPage.expectPasswordStep();

    await loginPage.passwordInput.fill('PasswordA@12');
    await loginPage.continueButton.click();
    await loginPage.expectMfaStep();

    console.log('OTP required. Enter it in the browser, then click Resume in the Playwright Inspector.');
    await page.pause();

    await loginPage.continueButton.click();
    await loginPage.expectLoggedIn();

    // Save state directly from the authenticated context
    await page.context().storageState({ path: authFile });
    console.log(`💾 Fresh session written to ${authFile}`);
}
