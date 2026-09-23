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

	it('falls back to the assessor when the firm name is only quotes', () => {
		expect(gutachtenSender({ assessorName: 'Anna Berger', companyName: '""' })).toBe(
			'"Anna Berger via Gut8erPRO" <gutachten@gut8erpro.de>',
		)
	})

	it('encodes a German firm name rather than putting umlauts on the wire raw', () => {
		const from = gutachtenSender({ companyName: 'Müller & Söhne', assessorName: null })
		expect(from).toBe(
			`=?UTF-8?B?${Buffer.from('Müller & Söhne via Gut8erPRO', 'utf8').toString('base64')}?= <gutachten@gut8erpro.de>`,
		)
		expect(from).toMatch(/^[\x20-\x7E]+$/)
	})

	it('leaves a plain ASCII firm name quoted rather than encoded', () => {
		expect(gutachtenSender({ companyName: 'KFZ Berger GmbH', assessorName: null })).toBe(
			'"KFZ Berger GmbH via Gut8erPRO" <gutachten@gut8erpro.de>',
		)
	})

	it('stays inside the length Resend accepts when the firm name is absurd', () => {
		const from = gutachtenSender({ companyName: 'X'.repeat(500), assessorName: 'Anna Berger' })
		expect(from.length).toBeLessThanOrEqual(320)
		expect(from).toContain('<gutachten@gut8erpro.de>')
		expect(from).toContain('XXXX')
	})

	it('stays inside the length cap when the absurd name is also non-ASCII', () => {
		const from = gutachtenSender({ companyName: 'Ä'.repeat(500), assessorName: null })
		expect(from.length).toBeLessThanOrEqual(320)
		expect(from).toContain('<gutachten@gut8erpro.de>')
	})
})

describe('the sending domain', () => {
	it('is refused rather than guessed when unset', () => {
		delete process.env.RESEND_SENDING_DOMAIN
		expect(() => notificationSender()).toThrow(/RESEND_SENDING_DOMAIN/)
		expect(() => gutachtenSender({ assessorName: 'Anna Berger' })).toThrow(/RESEND_SENDING_DOMAIN/)
	})
})
