import { describe, expect, it } from 'vitest'
import {
	decodeNotificationParams,
	encodeNotificationParams,
	isNotificationMessageKey,
} from './messages'

describe('notification message keys', () => {
	it('recognises a key a route writes', () => {
		expect(isNotificationMessageKey('reportSent')).toBe(true)
	})

	it('does not mistake the prose of an old row for a key', () => {
		expect(isNotificationMessageKey('Report Sent')).toBe(false)
		expect(isNotificationMessageKey('')).toBe(false)
	})
})

describe('notification parameters', () => {
	it('survives the round trip through the description column', () => {
		const params = { title: 'Gutachten "2026-001"', recipient: 'kunde@example.com' }

		expect(decodeNotificationParams(encodeNotificationParams(params))).toEqual(params)
	})

	it('reads an old row’s prose as no parameters rather than throwing', () => {
		expect(decodeNotificationParams('Report "X" has been marked as completed.')).toEqual({})
	})

	it('drops anything that is not a value a message can interpolate', () => {
		expect(decodeNotificationParams('{"title":"G","nested":{"a":1},"count":3}')).toEqual({
			title: 'G',
			count: '3',
		})
	})
})
