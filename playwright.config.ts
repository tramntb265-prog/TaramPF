import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'html',
  
  use: {
    trace: 'on-first-retry',
  },

  projects: [
    // --- 1. THE ISOLATED SETUP GENERATORS ---
    {
      name: 'setup-standard',
      testMatch: '**/auth.setup.ts', // Only writes auth.json
      retries: 0,
      workers: 1,
    },

    // --- 2. THE ISOLATED TESTING CONSUMERS ---
    {
      name: 'chromium-standard',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'auth.json', // Only injects standard session
      },
      dependencies: ['setup-standard'], 
    },
  {
    name: 'chromium-pf',
    use: { 
      ...devices['Desktop Chrome'],
    },
    testMatch: '**/PFTest/**/*.spec.ts',
  },
  ],
});
