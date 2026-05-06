// Regression tests for AI response parsers.
//
// These pin the fixes shipped after the real-photo Audi A6 QA pass
// (testing/reports/2026-05-06-real-photos-canon-test*.md). Each test
// names the bug it prevents from coming back. If a future prompt edit
// or schema change breaks one of these, the test fails before the
// regression reaches a real Gutachten.

import { describe, expect, it } from 'vitest'
import { parseDamageResponse } from './damage-analyzer'
import { parseInteriorResponse } from './interior-analyzer'
import { parseOverviewResponse } from './overview-analyzer'

describe('parseDamageResponse', () => {
	it('drops markers when noDamageVisible is true', () => {
		// Bug: clean overview / dashboard photos were producing fallback
		// "centre" damage markers. Result: 3 of 5 markers in the live PDF
		// described damage that wasn't in the input photos.
		const raw = JSON.stringify({
			noDamageVisible: true,
			description: '',
			severity: 'minor',
			damageTypes: [],
			affectedParts: [],
			repairApproach: '',
			estimatedRepairHours: null,
			boundingBoxes: [],
			diagramPosition: null,
		})
		const out = parseDamageResponse('photo-1', raw)
		expect(out.noDamageVisible).toBe(true)
		expect(out.diagramPosition).toBeNull()
	})

	it('drops diagramPosition when AI returns null even if noDamageVisible is false', () => {
		// Defensive: parser must never invent a marker. If the model can't
		// localize damage on the diagram, position stays null and
		// `collectDamageMarkers` skips the photo.
		const raw = JSON.stringify({
			noDamageVisible: false,
			description: 'Visible damage but unclear where on car',
			severity: 'moderate',
			damageTypes: ['dent'],
			affectedParts: ['unknown'],
			repairApproach: '',
			estimatedRepairHours: 1,
			boundingBoxes: [],
			diagramPosition: null,
		})
		const out = parseDamageResponse('photo-2', raw)
		expect(out.diagramPosition).toBeNull()
	})

	it('keeps a valid diagramPosition with clamped coordinates', () => {
		const raw = JSON.stringify({
			noDamageVisible: false,
			description: 'Rear-left quarter panel dent',
			severity: 'moderate',
			damageTypes: ['dent'],
			affectedParts: ['rear-left quarter panel'],
			repairApproach: 'PDR',
			estimatedRepairHours: 2,
			boundingBoxes: [],
			diagramPosition: { x: 12, y: 130, comment: 'dent' }, // y is over 100
		})
		const out = parseDamageResponse('photo-3', raw)
		expect(out.diagramPosition).not.toBeNull()
		expect(out.diagramPosition?.y).toBe(100) // clamped
	})

	it('falls back to noDamageVisible=true on unparseable JSON', () => {
		// If the model returns garbage we must NOT pretend damage exists.
		const out = parseDamageResponse('photo-4', 'not json at all')
		expect(out.noDamageVisible).toBe(true)
		expect(out.diagramPosition).toBeNull()
		expect(out.boundingBoxes).toEqual([])
	})

	it('strips ```json fences before parsing', () => {
		const raw = '```json\n{"noDamageVisible": true, "diagramPosition": null}\n```'
		const out = parseDamageResponse('photo-5', raw)
		expect(out.noDamageVisible).toBe(true)
	})
})

describe('parseOverviewResponse', () => {
	it('returns null for non-canonical enum values instead of leaking raw text', () => {
		// Bug: condition fields like generalCondition were stored as raw AI
		// strings ("good", "fine", "okay") which then leaked into the German
		// PDF because valueTranslations only has the canonical title-case
		// keys. The parser now rejects anything that isn't allowed.
		const raw = JSON.stringify({
			description: 'Silver Audi sedan',
			color: 'Silver',
			make: 'Audi',
			model: 'A6',
			bodyType: 'Sedan',
			generalCondition: 'good', // not allowed (must be Well maintained / Average / Poor)
			bodyCondition: 'fine', // not allowed
			paintType: 'shiny', // not allowed
			paintCondition: 'okay', // not allowed
			drivingAbility: 'maybe', // not allowed
		})
		const out = parseOverviewResponse('photo-1', raw)
		expect(out.generalCondition).toBeNull()
		expect(out.bodyCondition).toBeNull()
		expect(out.paintType).toBeNull()
		expect(out.paintCondition).toBeNull()
		expect(out.drivingAbility).toBeNull()
		// non-enum fields still pass through
		expect(out.make).toBe('Audi')
		expect(out.model).toBe('A6')
	})

	it('accepts canonical enum values case-insensitively', () => {
		const raw = JSON.stringify({
			description: 'Silver Audi sedan',
			color: 'Silver',
			make: 'Audi',
			model: 'A6',
			bodyType: 'Sedan',
			generalCondition: 'WELL MAINTAINED',
			bodyCondition: 'no damage',
			paintType: 'metallic',
			paintCondition: 'Good',
			drivingAbility: 'roadworthy',
		})
		const out = parseOverviewResponse('photo-2', raw)
		expect(out.generalCondition).toBe('Well maintained')
		expect(out.bodyCondition).toBe('No damage')
		expect(out.paintType).toBe('Metallic')
		expect(out.paintCondition).toBe('Good')
		expect(out.drivingAbility).toBe('Roadworthy')
	})
})

describe('parseInteriorResponse', () => {
	it('normalizes lowercase condition to canonical title-case', () => {
		// Bug: interiorCondition was stored as raw "good" so the German PDF
		// printed "good" instead of "Gut". Parser now matches title-case.
		const raw = JSON.stringify({
			description: 'Black leather interior',
			condition: 'good',
			features: ['leather seats', 'navigation system'],
			mileage: 142000,
			parkingSensors: true,
			airbagsDeployed: false,
		})
		const out = parseInteriorResponse('photo-1', raw)
		expect(out.condition).toBe('Good')
		expect(out.mileage).toBe(142000)
		expect(out.features).toContain('leather seats')
	})

	it('returns null for non-canonical condition values', () => {
		const raw = JSON.stringify({
			description: 'Interior',
			condition: 'pristine', // not in allowed list
			features: [],
			mileage: null,
			parkingSensors: null,
			airbagsDeployed: null,
		})
		const out = parseInteriorResponse('photo-2', raw)
		expect(out.condition).toBeNull()
	})
})
