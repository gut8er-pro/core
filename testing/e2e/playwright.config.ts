import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth/user.json')

export default defineConfig({
	testDir: '.',
	timeout: 60_000,
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
		// the language. `locale` sets Accept-Language *and* navigator.language, so
		// client-side Intl formatting matches the server. With no NEXT_LOCALE
		// cookie, src/i18n/request.ts reads Accept-Language directly.
		locale: 'en-US',
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
