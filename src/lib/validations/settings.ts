import { z } from 'zod'

const profileSettingsSchema = z.object({
	title: z.string().optional().nullable(),
	firstName: z.string().min(1, 'First name is required').optional().nullable(),
	lastName: z.string().min(1, 'Last name is required').optional().nullable(),
	phone: z.string().optional().nullable(),
})

const businessSettingsSchema = z.object({
	companyName: z.string().min(1, 'Company name is required'),
	street: z.string().min(1, 'Street is required'),
	postcode: z
		.string()
		.min(5, 'Postcode must be 5 digits')
		.max(5, 'Postcode must be 5 digits')
		.regex(/^\d{5}$/, 'Postcode must be 5 digits'),
	city: z.string().min(1, 'City is required'),
	taxId: z.string().min(1, 'Tax ID (Steuernummer) is required'),
	vatId: z
		.string()
		.optional()
		.nullable()
		.refine((val) => !val || /^DE\d{9}$/.test(val), {
			message: 'VAT ID must be in format DE + 9 digits',
		}),
	logoUrl: z.string().url().optional().nullable(),
})

const integrationSettingsSchema = z.object({
	provider: z.enum(['DAT', 'AUDATEX', 'GT_MOTIVE']),
	username: z.string().optional(),
	password: z.string().optional(),
	isActive: z.boolean(),
})

const settingsUpdateSchema = z.object({
	profile: profileSettingsSchema.optional(),
	business: businessSettingsSchema.optional(),
	integration: integrationSettingsSchema.optional(),
	logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
})

type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>
type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>
type IntegrationSettingsInput = z.infer<typeof integrationSettingsSchema>
type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>

export {
	profileSettingsSchema,
	businessSettingsSchema,
	integrationSettingsSchema,
	settingsUpdateSchema,
}
export type {
	ProfileSettingsInput,
	BusinessSettingsInput,
	IntegrationSettingsInput,
	SettingsUpdateInput,
}
