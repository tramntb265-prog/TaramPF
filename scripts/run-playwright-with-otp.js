#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');

const OTP_MARKER = '[[OTP_REQUIRED]]';

function askOtp() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    rl.question('Enter OTP code and press Enter: ', (answer) => {
      rl.close();
      resolve((answer || '').trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error('Usage: node scripts/run-playwright-with-otp.js <playwright args>');
    process.exit(1);
  }

  const otpFromEnv = (process.env.PF_OTP || process.env.OTP_CODE || '').trim();
  const otpFilePath = path.join(os.tmpdir(), `pf-otp-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`);
  fs.writeFileSync(otpFilePath, '', 'utf8');

  if (otpFromEnv) {
    fs.writeFileSync(otpFilePath, otpFromEnv, 'utf8');
  }

  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['playwright', ...args],
    {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, PF_OTP_FILE: otpFilePath },
      shell: false,
    }
  );

  let prompted = Boolean(otpFromEnv);

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  child.stdout.on('data', async (chunk) => {
    process.stdout.write(chunk);

    if (!prompted && chunk.includes(OTP_MARKER)) {
      prompted = true;

      if (!process.stdin.isTTY || !process.stdout.isTTY) {
        console.error('No interactive terminal detected. Set PF_OTP (or OTP_CODE) before running.');
        child.kill();
        return;
      }

      const otp = await askOtp();
      if (!otp) {
        console.error('OTP cannot be empty.');
        child.kill();
        return;
      }

      fs.writeFileSync(otpFilePath, otp, 'utf8');
    }
  });

  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  child.on('exit', (code) => {
    try {
      fs.unlinkSync(otpFilePath);
    } catch {
      // Ignore cleanup errors.
    }
    process.exit(code ?? 1);
  });

  child.on('error', (error) => {
    console.error(error.message);
    process.exit(1);
  });
}

main();
