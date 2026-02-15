import { z } from 'zod'

const exportConfigSchema = z.object({
	includeValuation: z.boolean().optional(),
	includeCommission: z.boolean().optional(),
	includeInvoice: z.boolean().optional(),
	lockReport: z.boolean().optional(),
	recipientEmail: z.string().email('Invalid email address').max(254).nullable().optional(),
	recipientName: z.string().max(200).nullable().optional(),
	emailSubject: z.string().max(500).nullable().optional(),
	emailBody: z.string().max(10000).nullable().optional(),
})

const sendReportSchema = z.object({
	recipientEmail: z.string().email('A valid recipient email is required'),
	recipientName: z.string().min(1, 'Recipient name is required').max(200),
	emailSubject: z.string().min(1, 'Subject is required').max(500),
	emailBody: z.string().max(10000).optional(),
	lockReport: z.boolean().optional(),
})

type ExportConfigInput = z.infer<typeof exportConfigSchema>
type SendReportInput = z.infer<typeof sendReportSchema>

export { exportConfigSchema, sendReportSchema }
export type { ExportConfigInput, SendReportInput }
