import { z } from 'zod'

const createReportSchema = z.object({
	title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
})

const updateReportSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	status: z.enum(['DRAFT', 'COMPLETED', 'SENT', 'LOCKED']).optional(),
	completionPercentage: z.number().int().min(0).max(100).optional(),
	isLocked: z.boolean().optional(),
})

const reportListParamsSchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10),
	status: z.enum(['DRAFT', 'COMPLETED', 'SENT', 'LOCKED']).optional(),
	sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
	sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

type CreateReportInput = z.infer<typeof createReportSchema>
type UpdateReportInput = z.infer<typeof updateReportSchema>
type ReportListParams = z.infer<typeof reportListParamsSchema>

export {
	createReportSchema,
	updateReportSchema,
	reportListParamsSchema,
}
export type { CreateReportInput, UpdateReportInput, ReportListParams }
