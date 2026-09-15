import { z } from 'zod'

const createTemplateSchema = z.object({
	subject: z
		.string()
		.min(1, 'Subject is required')
		.max(200, 'Subject must be under 200 characters'),
	body: z.string().max(20000, 'Body must be under 20000 characters'),
})

const updateTemplateSchema = z.object({
	subject: z
		.string()
		.min(1, 'Subject is required')
		.max(200, 'Subject must be under 200 characters')
		.optional(),
	body: z.string().max(20000, 'Body must be under 20000 characters').optional(),
})

type CreateTemplateInput = z.infer<typeof createTemplateSchema>
type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>

export type { CreateTemplateInput, UpdateTemplateInput }
export { createTemplateSchema, updateTemplateSchema }
