const NOTIFICATION_MESSAGE_KEYS = [
	'reportCompleted',
	'reportFieldsComplete',
	'reportSent',
	'invoiceGenerated',
] as const

type NotificationMessageKey = (typeof NOTIFICATION_MESSAGE_KEYS)[number]

type NotificationParams = Record<string, string>

function isNotificationMessageKey(value: string): value is NotificationMessageKey {
	return (NOTIFICATION_MESSAGE_KEYS as readonly string[]).includes(value)
}

function encodeNotificationParams(params: NotificationParams): string {
	return JSON.stringify(params)
}

function decodeNotificationParams(raw: string): NotificationParams {
	let parsed: unknown
	try {
		parsed = JSON.parse(raw)
	} catch {
		return {}
	}
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

	const params: NotificationParams = {}
	for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
		if (typeof value === 'string') params[key] = value
		else if (typeof value === 'number' || typeof value === 'boolean') params[key] = String(value)
	}
	return params
}

export type { NotificationMessageKey, NotificationParams }
export {
	decodeNotificationParams,
	encodeNotificationParams,
	isNotificationMessageKey,
	NOTIFICATION_MESSAGE_KEYS,
}
