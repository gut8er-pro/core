const IBAN_MAX_LENGTH = 34

const IBAN_LENGTH_BY_COUNTRY: Record<string, number> = {
	AT: 20,
	BE: 16,
	CH: 21,
	CZ: 24,
	DE: 22,
	DK: 18,
	ES: 24,
	FR: 27,
	GB: 22,
	IT: 27,
	LI: 21,
	LU: 20,
	NL: 18,
	PL: 28,
	PT: 25,
	SE: 24,
	SK: 24,
}

/** What gets stored: uppercase, no spaces or punctuation. */
function normalizeIban(value: string): string {
	return value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase()
}

/** What gets shown: groups of four, the way assessors read them off a letter. */
function formatIban(value: string): string {
	const normalized = normalizeIban(value).slice(0, IBAN_MAX_LENGTH)
	return normalized.replace(/(.{4})(?=.)/g, '$1 ')
}

function mod97(value: string): number {
	let remainder = 0
	for (const char of value) {
		const code = char.charCodeAt(0)
		const digits = code >= 65 ? String(code - 55) : char
		for (const digit of digits) {
			remainder = (remainder * 10 + Number(digit)) % 97
		}
	}
	return remainder
}

/**
 * ISO 13616: structure, the country's own length where we know it, and the
 * MOD-97 check digits — which is what actually catches a mistyped account.
 */
function isValidIban(value: string): boolean {
	const iban = normalizeIban(value)
	if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false

	const expectedLength = IBAN_LENGTH_BY_COUNTRY[iban.slice(0, 2)]
	if (expectedLength && iban.length !== expectedLength) return false

	return mod97(iban.slice(4) + iban.slice(0, 4)) === 1
}

export { formatIban, IBAN_MAX_LENGTH, isValidIban, normalizeIban }
