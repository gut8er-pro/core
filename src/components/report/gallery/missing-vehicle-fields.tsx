import { useTranslations } from 'next-intl'

type MissingVehicleFieldsProps = {
	fields: string[]
}

/**
 * The Generate summary line naming the vehicle fields no source stated. Generate
 * writes extracted values only, so an empty field is expected — the assessor has
 * to be told which ones to enter by hand.
 */
function MissingVehicleFields({ fields }: MissingVehicleFieldsProps) {
	const t = useTranslations('report.gallery')
	const names = fields
		.filter((field) => t.has(`vehicleFieldNames.${field}`))
		.map((field) => t(`vehicleFieldNames.${field}`))
	if (names.length === 0) return null

	return (
		<p className="text-body-sm text-warning-dark">
			{t('missingVehicleFields', { fields: names.join(', ') })}
		</p>
	)
}

export { MissingVehicleFields }
