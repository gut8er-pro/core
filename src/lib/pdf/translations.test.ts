import { describe, expect, it } from 'vitest'
import { normalizeConditionValue, translateValue } from './translations'

describe('normalizeConditionValue', () => {
	it('title-cases lowercase condition adjectives so they match valueTranslations keys', () => {
		expect(normalizeConditionValue('good')).toBe('Good')
		expect(normalizeConditionValue('fair')).toBe('Fair')
		expect(normalizeConditionValue('poor')).toBe('Poor')
		expect(normalizeConditionValue('excellent')).toBe('Excellent')
	})

	it('passes already-canonical values through unchanged', () => {
		expect(normalizeConditionValue('Roadworthy')).toBe('Roadworthy')
		expect(normalizeConditionValue('Metallic')).toBe('Metallic')
		expect(normalizeConditionValue('Well maintained')).toBe('Well maintained')
	})

	it('normalizes hyphenated synonyms', () => {
		expect(normalizeConditionValue('well-maintained')).toBe('Well maintained')
	})

	it('normalizes paint type and driving ability variants', () => {
		expect(normalizeConditionValue('metallic')).toBe('Metallic')
		expect(normalizeConditionValue('uni')).toBe('Uni (2 Schicht)')
		expect(normalizeConditionValue('not roadworthy')).toBe('Not roadworthy')
	})

	it('returns null for empty or nullish input', () => {
		expect(normalizeConditionValue(null)).toBeNull()
		expect(normalizeConditionValue('')).toBeNull()
		expect(normalizeConditionValue('   ')).toBeNull()
	})

	it('returns the input unchanged when it does not match any known synonym', () => {
		// Never lose data — unknown values pass through, and the PDF
		// translateValue() falls back to the raw string.
		expect(normalizeConditionValue('Some custom note')).toBe('Some custom note')
	})
})

describe('translateValue', () => {
	it('returns the original string for English locale', () => {
		expect(translateValue('Good', 'en')).toBe('Good')
	})

	it('translates canonical condition values to German', () => {
		expect(translateValue('Good', 'de')).toBe('Gut')
		expect(translateValue('Fair', 'de')).toBe('Befriedigend')
		expect(translateValue('Poor', 'de')).toBe('Schlecht')
		expect(translateValue('Excellent', 'de')).toBe('Sehr gut')
	})

	it('translates lowercase legacy values via the backstop entries', () => {
		// Pre-existing DB rows that stored 'good' lowercase still render correctly.
		expect(translateValue('good', 'de')).toBe('Gut')
		expect(translateValue('poor', 'de')).toBe('Schlecht')
	})

	it('translates driving-ability and paint-type values', () => {
		expect(translateValue('Roadworthy', 'de')).toBe('Fahrbereit')
		expect(translateValue('Not roadworthy', 'de')).toBe('Nicht fahrbereit')
		expect(translateValue('Metallic', 'de')).toBe('Metallic')
	})

	it('returns empty string for nullish input', () => {
		expect(translateValue(null, 'de')).toBe('')
		expect(translateValue(undefined, 'de')).toBe('')
		expect(translateValue('', 'de')).toBe('')
	})

	it('passes through unknown values unchanged', () => {
		expect(translateValue('Some custom note', 'de')).toBe('Some custom note')
	})

	it('title-cases lowercase vehicleType keys for English PDFs', () => {
		// Bug from real-photo PDF: vehicleType stored as canonical lowercase
		// ('sedan', 'suv') was printed verbatim in the EN PDF instead of
		// 'Sedan'/'SUV'. Lowercase stays the canonical UI/DB key; the
		// translation layer maps it to a display label per locale.
		expect(translateValue('sedan', 'en')).toBe('Sedan')
		expect(translateValue('suv', 'en')).toBe('SUV')
		expect(translateValue('wagon', 'en')).toBe('Wagon')
		expect(translateValue('coupe', 'en')).toBe('Coupe')
		expect(translateValue('convertible', 'en')).toBe('Convertible')
		expect(translateValue('van', 'en')).toBe('Van')
		expect(translateValue('compact', 'en')).toBe('Compact')
	})

	it('translates lowercase vehicleType keys to German', () => {
		expect(translateValue('sedan', 'de')).toBe('Limousine')
		expect(translateValue('suv', 'de')).toBe('SUV')
		expect(translateValue('wagon', 'de')).toBe('Kombi')
	})
})
