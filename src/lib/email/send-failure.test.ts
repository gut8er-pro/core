import { describe, expect, it } from 'vitest'
import { classifyResendError } from './send-failure'

/**
 * Real Resend payloads. E2E sends go to the account owner and always succeed,
 * so these mocks are the only coverage the failure branches get.
 */

describe('assessor-correctable failures', () => {
	it('classifies a malformed recipient address', () => {
		expect(
			classifyResendError({
				name: 'validation_error',
				statusCode: 422,
				message:
					'Invalid `to` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format.',
			}),
		).toBe('recipient_rejected')
	})

	it('classifies a missing recipient', () => {
		expect(
			classifyResendError({
				name: 'missing_required_field',
				statusCode: 422,
				message: 'Missing `to` field.',
			}),
		).toBe('recipient_rejected')
	})

	it('classifies an attachment past the provider size cap by status', () => {
		expect(
			classifyResendError({
				name: 'application_error',
				statusCode: 413,
				message: 'Request Entity Too Large',
			}),
		).toBe('attachment_too_large')
	})

	it('classifies an attachment past the provider size cap by message', () => {
		expect(
			classifyResendError({
				name: 'invalid_attachment',
				statusCode: 422,
				message: 'The total attachments size is too large. The maximum size is 40MB.',
			}),
		).toBe('attachment_too_large')
	})
})

describe('service failures', () => {
	it('classifies the sandbox restriction — it names our recipients but is our domain', () => {
		expect(
			classifyResendError({
				name: 'validation_error',
				statusCode: 403,
				message:
					'You can only send testing emails to your own email address (owner@example.com). To send emails to other recipients, please verify a domain at resend.com/domains, and change the `from` address to an email using this domain.',
			}),
		).toBe('email_service_unavailable')
	})

	it('classifies an unverified sending domain', () => {
		expect(
			classifyResendError({
				name: 'invalid_from_address',
				statusCode: 403,
				message: 'The gut8erpro.de domain is not verified. Please verify your domain.',
			}),
		).toBe('email_service_unavailable')
	})

	it('classifies a rejected key', () => {
		expect(
			classifyResendError({
				name: 'invalid_api_key',
				statusCode: 403,
				message: 'API key is invalid.',
			}),
		).toBe('email_service_unavailable')
	})

	it('classifies a rate limit', () => {
		expect(
			classifyResendError({
				name: 'rate_limit_exceeded',
				statusCode: 429,
				message: 'Too many requests. You can only make 2 requests per second.',
			}),
		).toBe('email_service_unavailable')
	})

	it('classifies a malformed attachment as ours, not the assessor’s', () => {
		expect(
			classifyResendError({
				name: 'invalid_attachment',
				statusCode: 422,
				message: 'Attachment must have either a `content` or `path`.',
			}),
		).toBe('email_service_unavailable')
	})

	it('classifies by name, so a reworded provider message cannot reclassify', () => {
		expect(
			classifyResendError({
				name: 'invalid_from_address',
				statusCode: 403,
				message: 'Something entirely new about the `to` field.',
			}),
		).toBe('email_service_unavailable')
	})

	it('classifies a thrown transport error', () => {
		expect(classifyResendError(new Error('fetch failed'))).toBe('email_service_unavailable')
	})

	it('classifies something it has never seen', () => {
		expect(classifyResendError({})).toBe('email_service_unavailable')
	})
})
