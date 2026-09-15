import { beforeEach, describe, expect, it } from 'vitest'
import { consumeQueryParam, NEW_REPORT_PARAM, PAYMENT_PARAM } from './navigation'

/**
 * Both params are one-shot instructions to the screen being opened, and the dashboard
 * carries both at once on the one journey that matters — signup, through Checkout, into
 * "create your first report". So consuming one must leave the other intact.
 */

beforeEach(() => {
	window.history.replaceState(null, '', '/')
})

describe('consumeQueryParam', () => {
	it('returns the value and strips only that param', () => {
		window.history.replaceState(null, '', `/?${PAYMENT_PARAM}=success&${NEW_REPORT_PARAM}=1`)

		expect(consumeQueryParam(PAYMENT_PARAM)).toBe('success')
		expect(window.location.search).toBe(`?${NEW_REPORT_PARAM}=1`)
	})

	it('leaves a clean path behind when it takes the last param', () => {
		window.history.replaceState(null, '', `/?${NEW_REPORT_PARAM}=1`)

		expect(consumeQueryParam(NEW_REPORT_PARAM)).toBe('1')
		expect(window.location.pathname).toBe('/')
		expect(window.location.search).toBe('')
	})

	// The second read is what React StrictMode's double mount performs, and what a
	// refresh would perform. Neither may look like a fresh instruction.
	it('answers null once the param has been consumed', () => {
		window.history.replaceState(null, '', `/?${PAYMENT_PARAM}=success`)

		expect(consumeQueryParam(PAYMENT_PARAM)).toBe('success')
		expect(consumeQueryParam(PAYMENT_PARAM)).toBeNull()
	})

	it('answers null for a param that was never there', () => {
		expect(consumeQueryParam(PAYMENT_PARAM)).toBeNull()
	})
})
