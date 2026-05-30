/// <reference types="node" />

import { test as setup, Page } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';
import fs from 'fs';
import path from 'path';

const authFile = path.resolve(__dirname, '../auth.json');
const legacyAuthFile = path.resolve(__dirname, '../PFauth.json');
const dashboardUrl = 'https://dev.flexigrow.app';

setup('refresh auth session once per run', async ({ browser }) => {
    setup.setTimeout(3 * 60 * 1000);

    if (!fs.existsSync(authFile) && fs.existsSync(legacyAuthFile)) {
        fs.copyFileSync(legacyAuthFile, authFile);
    }

    const context = await browser.newContext({
        storageState: fs.existsSync(authFile) ? authFile : undefined,
    });

    const page = await context.newPage();
    await ensureSession(page);
    await context.storageState({ path: authFile });
    await page.close();
    await context.close();
});

async function ensureSession(page: Page): Promise<void> {
    if (fs.existsSync(authFile)) {
        try {
            await page.goto(dashboardUrl, { waitUntil: 'domcontentloaded' });

            const destination = await Promise.race([
                page.waitForURL(/.*\/dashboards.*/, { timeout: 8000 }).then(() => 'dashboard'),
                page.waitForURL(/.*\/login.*/, { timeout: 8000 }).then(() => 'login'),
            ]);

            if (destination === 'dashboard') {
                return;
            }
        } catch {
            // Will continue to login flow.
        }
    }

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill('testy131@yopmail.com');
    await loginPage.signInButton.click();
    await loginPage.expectPasswordStep();

    await loginPage.passwordInput.fill('PasswordA@12');
    await loginPage.continueButton.click();
    await loginPage.expectMfaStep();

    // MFA page is shown — prompt for OTP in terminal
    const otp = await promptOtp();
    await loginPage.otpCodeInput.fill(otp);
    await loginPage.continueButton.click();
    await loginPage.expectLoggedIn();
}

async function promptOtp(): Promise<string> {
    const otpFromEnv = (process.env.PF_OTP ?? process.env.OTP_CODE ?? '').trim();
    if (otpFromEnv) return otpFromEnv;

    const requestFile = process.env.PF_OTP_REQUEST_FILE;
    const responseFile = process.env.PF_OTP_RESPONSE_FILE;
    if (!requestFile || !responseFile) {
        throw new Error('OTP broker not configured. Ensure globalSetup is set in playwright.config.ts.');
    }

    // Signal the main process (globalSetup) to prompt the user in terminal.
    fs.writeFileSync(requestFile, '1', 'utf8');

    // Poll until main process writes the OTP back.
    const deadline = Date.now() + 2 * 60 * 1000;
    while (Date.now() < deadline) {
        if (fs.existsSync(responseFile)) {
            const otp = fs.readFileSync(responseFile, 'utf8').trim();
            try { fs.unlinkSync(responseFile); } catch { /* ignore */ }
            if (otp) return otp;
        }
        await new Promise(r => setTimeout(r, 200));
    }

    throw new Error('Timed out waiting for OTP. Set PF_OTP env variable to skip the prompt.');
}

