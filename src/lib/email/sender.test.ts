import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { gutachtenSender, notificationSender } from './sender'

const ORIGINAL_DOMAIN = process.env.RESEND_SENDING_DOMAIN

beforeEach(() => {
	process.env.RESEND_SENDING_DOMAIN = 'gut8erpro.de'
})

afterEach(() => {
	if (ORIGINAL_DOMAIN === undefined) delete process.env.RESEND_SENDING_DOMAIN
	else process.env.RESEND_SENDING_DOMAIN = ORIGINAL_DOMAIN
})

describe('notificationSender', () => {
	it('leaves from the notification local part in the platform name', () => {
		expect(notificationSender()).toBe('"Gut8erPRO" <noreply@gut8erpro.de>')
	})
})

describe('gutachtenSender', () => {
	it('leaves from the Gutachten local part, never the notification one', () => {
		expect(gutachtenSender({ assessorName: 'Anna Berger' })).toContain('<gutachten@gut8erpro.de>')
	})

	it('prefers the firm name over the assessor name', () => {
		expect(gutachtenSender({ assessorName: 'Anna Berger', companyName: 'KFZ Berger GmbH' })).toBe(
			'"KFZ Berger GmbH via Gut8erPRO" <gutachten@gut8erpro.de>',
		)
	})

	it('falls back to the assessor name when there is no firm', () => {
		expect(gutachtenSender({ assessorName: 'Anna Berger', companyName: null })).toBe(
			'"Anna Berger via Gut8erPRO" <gutachten@gut8erpro.de>',
		)
	})

	it('falls back to the platform name when there is neither', () => {
		expect(gutachtenSender({ assessorName: null, companyName: '   ' })).toBe(
			'"Gut8erPRO" <gutachten@gut8erpro.de>',
		)
	})

	it('cannot be made to start a header of its own', () => {
		const from = gutachtenSender({
			companyName: 'Evil\r\nBcc: victim@example.com',
			assessorName: null,
		})
		expect(from).not.toContain('\r')
		expect(from).not.toContain('\n')
		expect(from).toBe('"Evil Bcc: victim@example.com via Gut8erPRO" <gutachten@gut8erpro.de>')
	})

	it('cannot escape the quoted display name', () => {
		expect(gutachtenSender({ companyName: 'He said "hi" \\ bye', assessorName: null })).toBe(
			'"He said hi bye via Gut8erPRO" <gutachten@gut8erpro.de>',
		)
	})
})

describe('the sending domain', () => {
	it('is refused rather than guessed when unset', () => {
		delete process.env.RESEND_SENDING_DOMAIN
		expect(() => notificationSender()).toThrow(/RESEND_SENDING_DOMAIN/)
		expect(() => gutachtenSender({ assessorName: 'Anna Berger' })).toThrow(/RESEND_SENDING_DOMAIN/)
	})
})
