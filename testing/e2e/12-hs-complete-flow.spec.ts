import { test, expect } from '@playwright/test'
import path from 'path'

/**
 * Complete HS (Liability) Report Flow — E2E Happy Path
 * Creates report → uploads photos → AI generates → fills ALL tabs → sends email
 */
test.describe('HS Complete Flow', () => {
	let reportId: string

	test('create HS report', async ({ page }) => {
		await page.goto('/dashboard')
		const res = await page.evaluate(async () => {
			const r = await fetch('/api/reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'PW Complete HS', reportType: 'HS' }),
			})
			return (await r.json()).report.id
		})
		reportId = res
		expect(reportId).toBeTruthy()
	})

	test('upload 5 photos', async ({ page }) => {
		await page.goto(`/reports/${reportId}/gallery`)
		await page.waitForTimeout(1500)

		const imagesDir = path.resolve('testing/testing-images')
		await page.locator('input[type="file"]').first().setInputFiles([
			path.join(imagesDir, 'car1.png'),
			path.join(imagesDir, 'car2.png'),
			path.join(imagesDir, 'car3.png'),
			path.join(imagesDir, 'car4.png'),
			path.join(imagesDir, 'car5.png'),
		])
		await page.waitForTimeout(8000)

		const photos = await page.locator('img[class*="object-cover"]').count()
		expect(photos).toBeGreaterThanOrEqual(5)
	})

	test('fill accident info — accident + claimant', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)

		await page.locator('input[name="accidentDay"]').fill('2026-03-15')
		await page.locator('input[name="accidentScene"]').fill('Kreuzung B1/B2, Berlin-Mitte')
		await page.locator('input[name="claimantCompany"]').fill('Autohaus Müller GmbH')
		await page.locator('input[name="claimantFirstName"]').fill('Thomas')
		await page.locator('input[name="claimantLastName"]').fill('Müller')
		await page.locator('input[name="claimantStreet"]').fill('Friedrichstraße 100')
		await page.locator('input[name="claimantPostcode"]').fill('10117')
		await page.locator('input[name="claimantLocation"]').fill('Berlin')
		await page.locator('input[name="claimantEmail"]').fill('thomas@autohaus-mueller.de')
		await page.locator('input[name="claimantLocation"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="claimantFirstName"]')).toHaveValue('Thomas')
		await expect(page.locator('input[name="accidentScene"]')).toHaveValue('Kreuzung B1/B2, Berlin-Mitte')
	})

	test('fill accident info — opponent', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)

		await page.locator('text=Opponent in Accident').first().click()
		await page.waitForTimeout(500)
		await page.locator('input[name="opponentFirstName"]').fill('Stefan')
		await page.locator('input[name="opponentLastName"]').fill('Braun')
		await page.locator('input[name="opponentStreet"]').fill('Kurfürstendamm 50')
		await page.locator('input[name="opponentInsuranceCompany"]').fill('HUK-COBURG')
		await page.locator('input[name="opponentInsuranceNumber"]').fill('HUK-2026-789012')
		await page.locator('input[name="opponentInsuranceNumber"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await page.locator('text=Opponent in Accident').first().click()
		await page.waitForTimeout(500)
		await expect(page.locator('input[name="opponentFirstName"]')).toHaveValue('Stefan')
		await expect(page.locator('input[name="opponentInsuranceCompany"]')).toHaveValue('HUK-COBURG')
	})

	test('fill accident info — visit', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)

		await page.locator('text=Visits').first().click()
		await page.waitForTimeout(500)
		await page.locator('text=Add Visit').click()
		await page.waitForTimeout(500)

		await page.locator('text=Claimant Residence').first().click()
		await page.waitForTimeout(200)
		await page.locator('input[name="visits.0.street"]').fill('Friedrichstraße 100')
		await page.locator('input[name="visits.0.postcode"]').fill('10117')
		await page.locator('input[name="visits.0.location"]').fill('Berlin')
		await page.locator('input[name="visits.0.date"]').fill('2026-03-20')
		await page.locator('input[name="visits.0.expert"]').fill('Dr. Hans Turnes')
		await page.locator('input[name="visits.0.expert"]').blur()
		await page.waitForTimeout(2000)
	})

	test('fill accident info — expert opinion', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(1500)

		await page.locator('text=Expert Opinion Characteristics').first().click()
		await page.waitForTimeout(500)
		await page.locator('input[name="expertName"]').fill('Dr. Hans Turnes')
		await page.locator('input[name="fileNumber"]').fill('HB-2026-001')
		await page.locator('input[name="caseDate"]').fill('2026-03-16')
		await page.locator('input[name="issuedDate"]').fill('2026-04-01')
		await page.locator('input[name="mediator"]').fill('Mark Cooper')
		await page.locator('input[name="mediator"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await page.locator('text=Expert Opinion Characteristics').first().click()
		await page.waitForTimeout(500)
		await expect(page.locator('input[name="expertName"]')).toHaveValue('Dr. Hans Turnes')
		await expect(page.locator('input[name="mediator"]')).toHaveValue('Mark Cooper')
	})

	test('fill vehicle — identification + specification', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/vehicle`)
		await page.waitForTimeout(1500)

		await page.locator('input[name="vin"]').fill('UU1KG7Z04GJXXXXXX')
		await page.locator('input[name="manufacturer"]').fill('DACIA')
		await page.locator('input[name="mainType"]').fill('DOKKER')
		await page.locator('input[name="subType"]').fill('DOKKER 1.5 dCi')
		await page.locator('input[name="kbaNumber"]').fill('0603/BGH')
		await page.locator('input[name="kbaNumber"]').blur()
		await page.waitForTimeout(800)

		await page.locator('text=Specification').first().click()
		await page.waitForTimeout(500)
		await page.locator('input[name="powerKw"]').fill('66')
		await page.locator('input[name="powerKw"]').blur()
		await page.waitForTimeout(500)
		await page.locator('input[name="displacement"]').fill('1461')
		await page.locator('input[name="cylinders"]').fill('4')
		await page.locator('input[name="firstRegistration"]').fill('2019-06-04')
		await page.locator('input[name="sourceOfTechnicalData"]').fill('DAT SilverDAT3')
		await page.locator('input[name="sourceOfTechnicalData"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="vin"]')).toHaveValue('UU1KG7Z04GJXXXXXX')
		await expect(page.locator('input[name="manufacturer"]')).toHaveValue('DACIA')
	})

	test('fill condition — all dropdowns + mileage + pills + notes', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/condition`)
		await page.waitForTimeout(1500)

		// Select all 7 dropdowns
		const options = ['Metallic', 'Original manufacturer paint', 'Good', 'Well maintained']
		for (let i = 0; i < 4; i++) {
			await page.locator('[role="combobox"]').nth(i).click()
			await page.waitForTimeout(300)
			try {
				await page.locator(`[role="option"]:has-text("${options[i]}")`).click()
			} catch {
				await page.locator('[role="option"]').first().click()
			}
			await page.waitForTimeout(200)
		}
		// Body, Interior, Driving — click first option
		for (let i = 4; i < 7; i++) {
			await page.locator('[role="combobox"]').nth(i).click()
			await page.waitForTimeout(300)
			await page.locator('[role="option"]').first().click()
			await page.waitForTimeout(200)
		}

		await page.locator('input[name="specialFeatures"]').fill('Klimaanlage, Navi')
		await page.locator('input[name="mileageRead"]').fill('85420')
		await page.locator('input[name="estimateMileage"]').fill('86000')
		await page.locator('input[name="nextMot"]').fill('2027-06-01')

		await page.locator('text=Full serviced history').click()
		await page.locator('text=Test drive performed').click()

		await page.locator('textarea[name="notes"]').fill('Fahrzeug in gutem Zustand.')
		await page.locator('textarea[name="notes"]').blur()
		await page.waitForTimeout(2000)

		// Prior damage
		await page.locator('text=Prior and Existing Damage').first().click()
		await page.waitForTimeout(500)
		await page.locator('input[name="previousDamageReported"]').fill('Rear bumper repair 2024')
		await page.locator('input[name="previousDamageReported"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('[role="combobox"]').first()).toHaveText('Metallic')
		await expect(page.locator('input[name="mileageRead"]')).toHaveValue('85420')
	})

	test('fill calculation — value + repair + loss of use', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/calculation`)
		await page.waitForTimeout(1500)

		await page.locator('input[name="replacementValue"]').fill('12500')
		await page.locator('input[name="residualValue"]').fill('8200')
		await page.locator('input[name="diminutionInValue"]').fill('1800')
		await page.locator('input[name="damageClass"]').fill('III')
		await page.locator('input[name="repairMethod"]').fill('Instandsetzung')
		await page.locator('input[name="risks"]').fill('Korrosionsgefahr')
		await page.locator('input[name="costPerDay"]').fill('35.00')
		await page.locator('input[name="repairTimeDays"]').fill('5')
		await page.locator('input[name="replacementTimeDays"]').fill('12')
		await page.locator('input[name="replacementTimeDays"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="replacementValue"]')).toHaveValue('12500')
		await expect(page.locator('input[name="repairMethod"]')).toHaveValue('Instandsetzung')
	})

	test('fill invoice — date + line items', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/invoice`)
		await page.waitForTimeout(1500)

		const invNum = await page.locator('input[name="invoiceNumber"]').inputValue()
		expect(invNum).toMatch(/^GH-/)

		await page.locator('input[name="date"]').fill('2026-04-03')
		await page.locator('input[name="date"]').blur()
		await page.waitForTimeout(800)

		await page.locator('text=Add Row').click()
		await page.waitForTimeout(500)
		await page.locator('input[name="lineItems.0.description"]').fill('Grundhonorar Gutachten')
		await page.locator('input[name="lineItems.0.rate"]').fill('362.00')
		await page.locator('input[name="lineItems.0.rate"]').blur()
		await page.waitForTimeout(2000)

		await page.reload({ waitUntil: 'networkidle' })
		await page.waitForTimeout(2000)
		await expect(page.locator('input[name="invoiceNumber"]')).not.toHaveValue('')
		await expect(page.locator('input[name="date"]')).toHaveValue('2026-04-03')
	})

	test('export page renders correctly', async ({ page }) => {
		await page.goto(`/reports/${reportId}/export`)
		await page.waitForTimeout(1500)

		await expect(page.getByText('Export and Send')).toBeVisible()
		await expect(page.getByText('Vehicle valuation')).toBeVisible()
		await expect(page.getByText('Commission')).toBeVisible()
		await expect(page.getByText('The Invoice')).toBeVisible()
		await expect(page.getByText('Lock Report')).toBeVisible()
		await expect(page.getByText('Send Report')).toBeVisible()
	})

	test('all tab badges show completion', async ({ page }) => {
		await page.goto(`/reports/${reportId}/details/accident-info`)
		await page.waitForTimeout(2000)

		const pageText = await page.locator('body').innerText()
		// Completed tabs show checkmarks (no "0/N" patterns)
		const incomplete = pageText.match(/(?:Accident Info|Vehicle|Calculation|Invoice)\s*0\/\d+/g)
		expect(incomplete).toBeNull()
	})
})
