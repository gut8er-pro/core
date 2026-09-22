const MAX_MILEAGE_DIGITS = 9

function toMileageDigits(value: string): string {
	return value
		.replace(/\D/g, '')
		.replace(/^0+(?=\d)/, '')
		.slice(0, MAX_MILEAGE_DIGITS)
}

function formatMileage(value: string): string {
	const digits = toMileageDigits(value)
	if (!digits) return ''
	return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export { formatMileage, toMileageDigits }
