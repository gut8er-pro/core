// AI answers must land on real select-option values (issue 17). The free-form
// English grades the model used to emit matched no option, so the stored value
// was silently unusable and the assessor re-entered it by hand.

import { describe, expect, it } from 'vitest'
import { parseCalculationResponse } from './calculation-extractor'
import { parseInteriorResponse } from './interior-analyzer'
import {
	BODY_PAINT_VALUES,
	normalizeBodyPaint,
	normalizeRepairOperation,
	REPAIR_OPERATION_VALUES,
} from './option-values'

describe('normalizeRepairOperation', () => {
	it('maps the phrasings the extractor used to emit', () => {
		expect(normalizeRepairOperation('Required')).toBe('required')
		expect(normalizeRepairOperation('Not required')).toBe('not_required')
		expect(normalizeRepairOperation('not_required')).toBe('not_required')
	})

	it('maps German answers', () => {
		expect(normalizeRepairOperation('erforderlich')).toBe('required')
		expect(normalizeRepairOperation('nicht erforderlich')).toBe('not_required')
		expect(normalizeRepairOperation('durchgeführt')).toBe('completed')
	})

	it('only emits values the select actually offers', () => {
		for (const raw of ['required', 'Not required', 'completed', 'ja', 'nein']) {
			const out = normalizeRepairOperation(raw)
			expect(REPAIR_OPERATION_VALUES).toContain(out)
		}
	})

	it('returns null for an answer it cannot place', () => {
		expect(normalizeRepairOperation('maybe after teardown')).toBeNull()
		expect(normalizeRepairOperation(null)).toBeNull()
		expect(normalizeRepairOperation('')).toBeNull()
	})
})

describe('normalizeBodyPaint', () => {
	it('maps the paint-scope phrasings onto the three options', () => {
		expect(normalizeBodyPaint('Spot repair')).toBe('partial')
		expect(normalizeBodyPaint('Panel repaint')).toBe('partial')
		expect(normalizeBodyPaint('Full section repaint')).toBe('full')
		expect(normalizeBodyPaint('Not required')).toBe('not_required')
	})

	it('maps German answers', () => {
		expect(normalizeBodyPaint('Beilackierung')).toBe('partial')
		expect(normalizeBodyPaint('Komplettlackierung')).toBe('full')
	})

	it('only emits values the select actually offers', () => {
		for (const raw of ['Spot repair', 'full repaint', 'none']) {
			expect(BODY_PAINT_VALUES).toContain(normalizeBodyPaint(raw))
		}
	})

	it('returns null rather than passing raw text through', () => {
		expect(normalizeBodyPaint('depends on the colour match')).toBeNull()
	})
})

describe('parseCalculationResponse', () => {
	it('normalizes the exact payload from the audit run', () => {
		// Issue 17 case 2: "Required" / "Spot repair" against selects that
		// expect required | not_required | partial | full.
		const raw = JSON.stringify({
			damageClass: 'II',
			repairMethod: 'Conventional body repair',
			risks: 'Possible hidden damage behind the bumper',
			wheelAlignment: 'Required',
			bodyMeasurements: 'Not required',
			bodyPaint: 'Spot repair',
			plasticRepair: true,
			estimatedRepairDays: 4,
		})
		const out = parseCalculationResponse(raw)
		expect(out.wheelAlignment).toBe('required')
		expect(out.bodyMeasurements).toBe('not_required')
		expect(out.bodyPaint).toBe('partial')
		// free text stays as written — these are TextField/textarea, not selects
		expect(out.repairMethod).toBe('Conventional body repair')
		expect(out.risks).toBe('Possible hidden damage behind the bumper')
		expect(out.damageClass).toBe('II')
	})

	it('keeps German free text and still normalizes the enums', () => {
		const raw = JSON.stringify({
			repairMethod: 'Ausbeulen ohne Lackieren (PDR)',
			risks: 'Verdeckte Schäden möglich',
			wheelAlignment: 'erforderlich',
			bodyMeasurements: 'nicht erforderlich',
			bodyPaint: 'Beilackierung',
		})
		const out = parseCalculationResponse(raw)
		expect(out.repairMethod).toBe('Ausbeulen ohne Lackieren (PDR)')
		expect(out.risks).toBe('Verdeckte Schäden möglich')
		expect(out.wheelAlignment).toBe('required')
		expect(out.bodyMeasurements).toBe('not_required')
		expect(out.bodyPaint).toBe('partial')
	})

	it('nulls an enum it cannot place instead of storing raw text', () => {
		const raw = JSON.stringify({ wheelAlignment: 'to be decided', bodyPaint: 'unclear' })
		const out = parseCalculationResponse(raw)
		expect(out.wheelAlignment).toBeNull()
		expect(out.bodyPaint).toBeNull()
	})
})

describe('parseInteriorResponse condition', () => {
	it('emits the Condition tab preset values', () => {
		// Issue 17 case 1: the analyzer wrote Excellent|Good|Fair|Poor into a
		// field whose options are Clean… | Minor wear | Significant wear.
		const raw = JSON.stringify({ description: 'Black cloth interior', condition: 'Minor wear' })
		expect(parseInteriorResponse('p1', raw).condition).toBe('Minor wear')
	})

	it('maps the legacy grades cached rows still carry', () => {
		const grade = (c: string) =>
			parseInteriorResponse('p1', JSON.stringify({ condition: c })).condition
		expect(grade('Excellent')).toBe('Clean, no structural damage.')
		expect(grade('good')).toBe('Clean, no structural damage.')
		expect(grade('Fair')).toBe('Minor wear')
		expect(grade('poor')).toBe('Significant wear')
	})

	it('returns null for anything off-list', () => {
		expect(
			parseInteriorResponse('p1', JSON.stringify({ condition: 'pristine' })).condition,
		).toBeNull()
		expect(parseInteriorResponse('p1', JSON.stringify({ condition: null })).condition).toBeNull()
	})
})
