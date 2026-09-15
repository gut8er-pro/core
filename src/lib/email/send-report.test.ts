import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const send = vi.fn()

vi.mock('./client', () => ({
	getResendClient: () => ({ emails: { send } }),
}))

const { sendReportEmail } = await import('./send-report')

const ORIGINAL_DOMAIN = process.env.RESEND_SENDING_DOMAIN

const BASE = {
	to: 'kunde@example.com',
	recipientName: 'Herr Schmidt',
	subject: 'Ihr Gutachten',
	body: '<p>Guten Tag</p>',
	reportTitle: 'Gutachten 2026-001',
	senderName: 'Anna Berger',
	senderCompany: 'KFZ Berger GmbH',
	replyTo: 'anna@berger-kfz.de',
}

beforeEach(() => {
	process.env.RESEND_SENDING_DOMAIN = 'gut8erpro.de'
	send.mockReset()
	send.mockResolvedValue({ data: { id: 'abc' }, error: null })
})

afterEach(() => {
	if (ORIGINAL_DOMAIN === undefined) delete process.env.RESEND_SENDING_DOMAIN
	else process.env.RESEND_SENDING_DOMAIN = ORIGINAL_DOMAIN
})

function sentPayload() {
	return send.mock.calls[0]?.[0]
}

describe('the envelope', () => {
	it('leaves from the Gutachten stream, carrying the assessor’s identity', async () => {
		await sendReportEmail(BASE)
		expect(sentPayload()).toMatchObject({
			from: '"KFZ Berger GmbH via Gut8erPRO" <gutachten@gut8erpro.de>',
			replyTo: 'anna@berger-kfz.de',
			to: ['kunde@example.com'],
		})
	})

	it('omits the reply path rather than sending an empty one', async () => {
		await sendReportEmail({ ...BASE, replyTo: undefined })
		expect(sentPayload()).not.toHaveProperty('replyTo')
	})
})

describe('interpolated fields', () => {
	it('escapes the report title, recipient and footer', async () => {
		await sendReportEmail({
			...BASE,
			recipientName: '<script>alert(1)</script>',
			reportTitle: 'Gutachten "A" & <b>B</b>',
			senderName: 'Anna <Berger>',
			senderCompany: 'Berger & Söhne',
		})
		const html = sentPayload().html as string

		expect(html).not.toContain('<script>')
		expect(html).toContain('&lt;script&gt;')
		expect(html).toContain('Gutachten &quot;A&quot; &amp; &lt;b&gt;B&lt;/b&gt;')
		expect(html).toContain('Anna &lt;Berger&gt; &mdash; Berger &amp; Söhne')
	})

	it('leaves the assessor’s composed body as the rich text it is', async () => {
		await sendReportEmail({ ...BASE, body: '<p>Sehr geehrte <strong>Damen</strong></p>' })
		expect(sentPayload().html).toContain('<p>Sehr geehrte <strong>Damen</strong></p>')
	})

	it('falls back to the platform name when the assessor has no name at all', async () => {
		await sendReportEmail({ ...BASE, senderName: '', senderCompany: undefined })
		const html = sentPayload().html as string
		expect(html).toContain('Gut8erPRO')
	})
})

describe('failures', () => {
	it('returns a classified code, never the provider’s prose', async () => {
		send.mockResolvedValue({
			data: null,
			error: { name: 'validation_error', statusCode: 422, message: 'Invalid `to` field.' },
		})
		const result = await sendReportEmail(BASE)

		expect(result).toEqual({
			success: false,
			code: 'recipient_rejected',
			detail: 'validation_error: Invalid `to` field.',
		})
	})

	it('classifies a thrown transport error as a service failure', async () => {
		send.mockRejectedValue(new Error('fetch failed'))
		const result = await sendReportEmail(BASE)

		expect(result).toMatchObject({ success: false, code: 'email_service_unavailable' })
	})
})
