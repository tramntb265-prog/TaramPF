/// <reference types="node" />

import { test as setup, Page } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const authFile = path.resolve(__dirname, '../auth.json');
const legacyAuthFile = path.resolve(__dirname, '../PFauth.json');
const dashboardUrl = 'https://dev.flexigrow.app';
const defaultOtpSecret = '55WBP4IXX4DC6EF6';

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
            // 1. Navigate and wait for the network to settle down
            await page.goto(dashboardUrl, { waitUntil: 'networkidle' });

            // 2. Safely capture the final URL after redirects settle
            const currentUrl = page.url();

            if (currentUrl.includes('/dashboards')) {
                return; // Session is valid! Escape early.
            }
        } catch (error) {
            console.log('Session validation failed, proceeding to manual login.');
        }
    }

    // 3. Fallback Login Flow
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill('testy131_24@yopmail.com');
    await loginPage.signInButton.click();
    await loginPage.expectPasswordStep();

    await loginPage.passwordInput.fill('PasswordA@12');
    
    // 4. Submit password and wait for the resulting navigation or URL change to finish
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 20000 }),
        loginPage.continueButton.click()
    ]);

    const postPasswordUrl = page.url();

    // 5. Explicitly handle the location where the browser actually landed
    
    // Scenario A: Landed on Dashboard
    if (postPasswordUrl.includes('/dashboards')) {
        await loginPage.expectLoggedIn();
        return;
    }

    // Scenario B: Landed on the MFA / OTP entry screen
    if (postPasswordUrl.includes('intent:verify_authenticator_app_code')) {
        // Use a softer 'attached' check in case the heading locator is slightly mismatched
        await loginPage.OtpPageHeading.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {
            console.log('OtpPageHeading element not found visually, but URL confirms MFA page.');
        });

        const otp = await promptOtp();
        await loginPage.otpCodeInput.fill(otp);
        await loginPage.continueButton.click();
        await loginPage.expectLoggedIn();
        return;
    }

    // Scenario C: Landed on an expired link page
    if (postPasswordUrl.includes('expired') || await page.locator('text="This link has expired"').isVisible()) {
        throw new Error('Login session expired. Please restart the test run to clean the browser contexts.');
    }

    // Scenario D: Caught in an unknown state
    throw new Error(`Stuck at login flow. Current page URL is: ${postPasswordUrl}`);
}

// 1. Put your default secret key back at the file scope level

async function promptOtp(): Promise<string> {
    const otpFromEnv = (process.env.PF_OTP ?? process.env.OTP_CODE ?? '').trim();
    if (otpFromEnv) {
        return otpFromEnv;
    }

    // 2. Use the environment variable, OR fallback to the defaultOtpSecret variable
    const otpSecret = (process.env.PF_OTP_SECRET ?? defaultOtpSecret).trim();
    if (otpSecret) {
        return generateTotp(otpSecret);
    }
    
    throw new Error('Unable to obtain OTP. Provide PF_OTP, PF_OTP_SECRET, or configure defaultOtpSecret.');
}

function generateTotp(secretBase32: string): string {
    const timeStep = 30;
    const digits = 6;
    const counter = Math.floor(Date.now() / 1000 / timeStep);

    const key = base32ToBuffer(secretBase32);
    const msg = Buffer.alloc(8);
    
    msg.writeBigUInt64BE(BigInt(counter), 0);

    const hmac = crypto.createHmac('sha1', key).update(msg).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff);

    const otp = (code % 10 ** digits).toString();
    return otp.padStart(digits, '0');
}

function base32ToBuffer(input: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');

    let bits = '';
    for (const char of clean) {
        const val = alphabet.indexOf(char);
        bits += val.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }

    return Buffer.from(bytes);
}


