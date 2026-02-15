import { z } from 'zod'

const loginSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
})

const signupAccountSchema = z
	.object({
		email: z.string().email('Please enter a valid email address'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string().min(1, 'Please confirm your password'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	})

const signupPersonalSchema = z.object({
	title: z.string().min(1, 'Please select a title'),
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	phone: z.string().min(1, 'Phone number is required'),
	professionalQualification: z.string().optional(),
})

const signupBusinessSchema = z.object({
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
		.refine((val) => !val || /^DE\d{9}$/.test(val), {
			message: 'VAT ID must be in format DE + 9 digits',
		}),
})

const signupPlanSchema = z.object({
	plan: z.enum(['pro']),
})

const signupIntegrationsSchema = z.object({
	provider: z.enum(['dat', 'audatex', 'gt_motive']).optional(),
	username: z.string().optional(),
	password: z.string().optional(),
})

type LoginInput = z.infer<typeof loginSchema>
type SignupAccountInput = z.infer<typeof signupAccountSchema>
type SignupPersonalInput = z.infer<typeof signupPersonalSchema>
type SignupBusinessInput = z.infer<typeof signupBusinessSchema>
type SignupPlanInput = z.infer<typeof signupPlanSchema>
type SignupIntegrationsInput = z.infer<typeof signupIntegrationsSchema>

export {
	loginSchema,
	signupAccountSchema,
	signupPersonalSchema,
	signupBusinessSchema,
	signupPlanSchema,
	signupIntegrationsSchema,
}
export type {
	LoginInput,
	SignupAccountInput,
	SignupPersonalInput,
	SignupBusinessInput,
	SignupPlanInput,
	SignupIntegrationsInput,
}
