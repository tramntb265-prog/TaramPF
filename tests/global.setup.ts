import readline from 'readline';
import fs from 'fs';
import os from 'os';
import path from 'path';

const OTP_REQUEST_FILE = path.join(os.tmpdir(), 'pw-otp-request.flag');
const OTP_RESPONSE_FILE = path.join(os.tmpdir(), 'pw-otp-response.txt');

// globalSetup runs in the Playwright MAIN process — the only process with real terminal stdin.
// Workers have piped stdin and can never receive keyboard input directly.
// This broker watches for a signal from the worker, prompts OTP in the main terminal,
// and writes the result back so the worker can read it.
async function globalSetup(): Promise<() => void> {
    // Clean stale files from any previous run.
    for (const f of [OTP_REQUEST_FILE, OTP_RESPONSE_FILE]) {
        try { fs.unlinkSync(f); } catch { /* ignore */ }
    }

    process.env.PF_OTP_REQUEST_FILE = OTP_REQUEST_FILE;
    process.env.PF_OTP_RESPONSE_FILE = OTP_RESPONSE_FILE;

    let handling = false;

    const interval = setInterval(async () => {
        if (handling || !fs.existsSync(OTP_REQUEST_FILE)) return;
        handling = true;

        try { fs.unlinkSync(OTP_REQUEST_FILE); } catch { /* ignore */ }
        try { fs.unlinkSync(OTP_RESPONSE_FILE); } catch { /* ignore */ }

        const otp = await new Promise<string>((resolve) => {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            rl.question('\n>>> MFA page is open in browser. Enter OTP code and press Enter: ', (answer) => {
                rl.close();
                resolve(answer.trim());
            });
        });

        fs.writeFileSync(OTP_RESPONSE_FILE, otp, 'utf8');
        handling = false;
    }, 200);

    return () => {
        clearInterval(interval);
        try { fs.unlinkSync(OTP_REQUEST_FILE); } catch { /* ignore */ }
        try { fs.unlinkSync(OTP_RESPONSE_FILE); } catch { /* ignore */ }
    };
}

export default globalSetup;
