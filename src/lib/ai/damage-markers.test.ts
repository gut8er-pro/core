import { describe, expect, it } from 'vitest'
import { getServerTranslations } from '@/i18n/translator'
import { collectDamageMarkers } from './pipeline'
import type { PhotoProcessingResult } from './types'

/**
 * A marker comment is written once and never translated again — it is stored on
 * the report and rendered into the PDF verbatim.
 */

function damageResult(): PhotoProcessingResult {
	return {
		type: 'damage',
		result: {
			photoId: 'p1',
			description: 'Hagelschaden auf der Motorhaube.',
			severity: 'moderate',
			damageTypes: ['dent'],
			affectedParts: ['Motorhaube'],
			repairApproach: 'Ausbeularbeiten nach PDR-Verfahren',
			estimatedRepairHours: 4,
			boundingBoxes: [],
			diagramPosition: { x: 50, y: 20, comment: 'Motorhaube - Hagelschaden' },
			noDamageVisible: false,
		},
	}
}

describe('damage marker comments', () => {
	it('carries German field labels and a German severity for a German report', async () => {
		const t = await getServerTranslations('de', 'report.ai')

		const [marker] = collectDamageMarkers([damageResult()], t)

		expect(marker?.comment).toBe(
			'Motorhaube - Hagelschaden | Schwere: mittel | Reparatur: Ausbeularbeiten nach PDR-Verfahren',
		)
	})

	it('carries English ones for an English report', async () => {
		const t = await getServerTranslations('en', 'report.ai')

		const [marker] = collectDamageMarkers([damageResult()], t)

		expect(marker?.comment).toBe(
			'Motorhaube - Hagelschaden | Severity: moderate | Repair: Ausbeularbeiten nach PDR-Verfahren',
		)
	})
})
