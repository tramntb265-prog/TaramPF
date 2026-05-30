/// <reference types="node" />

import { test as base, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const authFile = path.resolve(__dirname, '../../auth.json');
const legacyAuthFile = path.resolve(__dirname, '../../PFauth.json');
const dashboardUrl = 'https://dev.flexigrow.app';

type PFFixtures = {
    page: Page;
};

export const test = base.extend<PFFixtures>({
    page: [async ({ browser }, use) => {
        if (!fs.existsSync(authFile) && fs.existsSync(legacyAuthFile)) {
            fs.copyFileSync(legacyAuthFile, authFile);
        }

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
    }, { scope: 'test', timeout: 0 }],
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
            if (fs.existsSync(authFile)) {
                fs.unlinkSync(authFile);
            }
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

    console.log('MFA page is ready. Enter OTP in terminal and press Enter.');
    const otpFromInput = await readOtpFromTerminal();
    await loginPage.otpCodeInput.fill(otpFromInput);

    await loginPage.continueButton.click();
    await loginPage.expectLoggedIn();

    // Save state directly from the authenticated context
    await page.context().storageState({ path: authFile });
    console.log(`💾 Fresh session written to ${authFile}`);
}

async function readOtpFromTerminal(): Promise<string> {
    const otpFromEnv = process.env.PF_OTP ?? process.env.OTP_CODE;
    if (otpFromEnv && otpFromEnv.trim()) {
        return otpFromEnv.trim();
    }

    if (process.stdin.isTTY && process.stdout.isTTY) {
        return promptOtpWithReadline(process.stdin, process.stdout);
    }

    // Playwright workers can run with piped stdio. On Windows, read from the real console device.
    if (process.platform === 'win32') {
        const inputCandidates = ['\\\\.\\CONIN$', 'CONIN$'];
        const outputCandidates = ['\\\\.\\CONOUT$', 'CONOUT$'];

        try {
            for (const inPath of inputCandidates) {
                for (const outPath of outputCandidates) {
                    try {
                        const conIn = fs.createReadStream(inPath);
                        const conOut = fs.createWriteStream(outPath);
                        const otp = await promptOtpWithReadline(conIn, conOut);
                        conIn.close();
                        conOut.end();
                        return otp;
                    } catch {
                        // Try next device path pair.
                    }
                }
            }

            throw new Error(
                'Unable to read OTP from terminal in this Playwright process. Set PF_OTP (or OTP_CODE) before running the test.'
            );
        } catch {
            throw new Error(
                'Unable to read OTP from terminal in this Playwright process. Set PF_OTP (or OTP_CODE) before running the test.'
            );
        }
    }

    throw new Error(
        'Terminal input is not interactive in this Playwright process. Set PF_OTP (or OTP_CODE) before running the test.'
    );
}

async function promptOtpWithReadline(input: NodeJS.ReadableStream, output: NodeJS.WritableStream): Promise<string> {
    input.setEncoding?.('utf8');
    (input as NodeJS.ReadStream).resume?.();

    const rl = readline.createInterface({
        input,
        output,
        terminal: true,
    });

    const otp = await new Promise<string>((resolve) => {
        rl.question('Enter OTP code and press Enter: ', (answer: string) => {
            resolve(answer.trim());
        });
    });

    rl.close();

    if (!otp) {
        throw new Error('OTP cannot be empty. Re-run and provide OTP in terminal or set PF_OTP.');
    }

    return otp;
}
