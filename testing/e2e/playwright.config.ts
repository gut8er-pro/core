import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth/user.json')

export default defineConfig({
	testDir: '.',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: [
		['html', { outputFolder: path.join(__dirname, '../reports/playwright-html') }],
		['list'],
	],
	outputDir: path.join(__dirname, '../screenshots/test-results'),
	use: {
		baseURL: 'http://localhost:3000',
		// The app UI defaults to German; these specs assert English copy, so pin
		// the language for every request. The middleware seeds NEXT_LOCALE from
		// Accept-Language, so this covers specs with no stored cookie too.
		extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	projects: [
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
				storageState: AUTH_FILE,
			},
			dependencies: ['setup'],
		},
	],
})
