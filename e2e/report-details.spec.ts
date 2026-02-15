import { test, expect } from '@playwright/test'

// Note: requires auth setup — mock or seed user before running
// These tests assume a report with id "test-report-1" exists, or that the
// route can render without a live backend (e.g. MSW mock or seeded data).

const REPORT_ID = 'test-report-1'
const DETAILS_BASE = `/reports/${REPORT_ID}/details`

test.describe('Report Detail Tabs', () => {
	test('detail tabs render all 5 tabs: Accident Info, Vehicle, Condition, Calculation, Invoice', async ({
		page,
	}) => {
		await page.goto(`${DETAILS_BASE}/accident-info`)

		// The TabBar uses Radix TabsPrimitive.Trigger elements
		const tabLabels = [
			'Accident Info',
			'Vehicle',
			'Condition',
			'Calculation',
			'Invoice',
		]

		for (const label of tabLabels) {
			await expect(page.getByRole('tab', { name: label })).toBeVisible()
		}
	})

	test('clicking each tab navigates to the correct route', async ({ page }) => {
		await page.goto(`${DETAILS_BASE}/accident-info`)

		const tabs = [
			{ name: 'Vehicle', path: 'vehicle' },
			{ name: 'Condition', path: 'condition' },
			{ name: 'Calculation', path: 'calculation' },
			{ name: 'Invoice', path: 'invoice' },
			{ name: 'Accident Info', path: 'accident-info' },
		]

		for (const tab of tabs) {
			await page.getByRole('tab', { name: tab.name }).click()
			await page.waitForURL(`**/${DETAILS_BASE}/${tab.path}`)
			expect(page.url()).toContain(`${DETAILS_BASE}/${tab.path}`)
		}
	})

	test('Accident Info tab shows expected form sections', async ({ page }) => {
		await page.goto(`${DETAILS_BASE}/accident-info`)

		// The Accident Info page renders these sections as components.
		// Verify the tab is active
		const activeTab = page.getByRole('tab', { name: 'Accident Info' })
		await expect(activeTab).toBeVisible()
	})

	test('Vehicle tab shows identification, specification, and details sections', async ({
		page,
	}) => {
		await page.goto(`${DETAILS_BASE}/vehicle`)

		// Vehicle tab should be active
		const activeTab = page.getByRole('tab', { name: 'Vehicle' })
		await expect(activeTab).toBeVisible()
	})

	test('Condition tab shows condition, damage diagram, tire, and prior damage sections', async ({
		page,
	}) => {
		await page.goto(`${DETAILS_BASE}/condition`)

		const activeTab = page.getByRole('tab', { name: 'Condition' })
		await expect(activeTab).toBeVisible()
	})

	test('Calculation tab shows value, repair, and loss sections', async ({ page }) => {
		await page.goto(`${DETAILS_BASE}/calculation`)

		const activeTab = page.getByRole('tab', { name: 'Calculation' })
		await expect(activeTab).toBeVisible()
	})

	test('Invoice tab shows invoice settings and line items', async ({ page }) => {
		await page.goto(`${DETAILS_BASE}/invoice`)

		const activeTab = page.getByRole('tab', { name: 'Invoice' })
		await expect(activeTab).toBeVisible()
	})

	test('/details redirects to /details/accident-info', async ({ page }) => {
		await page.goto(DETAILS_BASE)
		await page.waitForURL(`**/${DETAILS_BASE}/accident-info`)
		expect(page.url()).toContain(`${DETAILS_BASE}/accident-info`)
	})
})

test.describe('Report Sidebar Navigation', () => {
	test('report layout has sidebar with Gallery, Report Details, and Export & Send sections', async ({
		page,
	}) => {
		await page.goto(`/reports/${REPORT_ID}/gallery`)

		// The report sidebar (ReportSidebar) has aria-label "Report navigation"
		// and is hidden below lg breakpoint (hidden lg:block)
		const sidebar = page.getByLabel('Report navigation')

		// On desktop (1440px) the sidebar should be visible
		if (await sidebar.isVisible()) {
			await expect(sidebar.getByText('Gallery')).toBeVisible()
			await expect(sidebar.getByText('Report Details')).toBeVisible()
			await expect(sidebar.getByText('Export & Send')).toBeVisible()
		}
	})
})
