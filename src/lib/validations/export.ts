import { z } from 'zod'

const exportConfigSchema = z.object({
	includeValuation: z.boolean().optional(),
	includeCommission: z.boolean().optional(),
	includeInvoice: z.boolean().optional(),
	lockReport: z.boolean().optional(),
	recipientEmail: z.string().max(500).nullable().optional(),
	recipientName: z.string().max(200).nullable().optional(),
	emailSubject: z.string().max(500).nullable().optional(),
	emailBody: z.string().max(10000).nullable().optional(),
})

const sendReportSchema = z.object({
	recipientEmail: z.string().min(1, 'At least one recipient email is required').refine(
		(val) => val.split(',').every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())),
		{ message: 'All recipient emails must be valid' },
	),
	recipientName: z.string().min(1, 'Recipient name is required').max(500),
	emailSubject: z.string().min(1, 'Subject is required').max(500),
	emailBody: z.string().max(10000).optional(),
	lockReport: z.boolean().optional(),
})

type ExportConfigInput = z.infer<typeof exportConfigSchema>
type SendReportInput = z.infer<typeof sendReportSchema>

export { exportConfigSchema, sendReportSchema }
export type { ExportConfigInput, SendReportInput }
