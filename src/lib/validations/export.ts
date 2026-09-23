import { z } from 'zod'
import { PDF_SECTIONS } from '@/lib/pdf/sections'

const RECIPIENT_MODES = ['claimant', 'claimant_lawyer'] as const

const exportConfigSchema = z.object({
	includeValuation: z.boolean().optional(),
	includeCommission: z.boolean().optional(),
	includeInvoice: z.boolean().optional(),
	lockReport: z.boolean().optional(),
	recipients: z.array(z.string().max(320)).max(50).optional(),
	recipientMode: z.enum(RECIPIENT_MODES).nullable().optional(),
	recipientEmail: z.string().max(500).nullable().optional(),
	recipientName: z.string().max(200).nullable().optional(),
	emailSubject: z.string().max(500).nullable().optional(),
	emailBody: z.string().max(10000).nullable().optional(),
})

const sendReportSchema = z.object({
	recipientEmail: z
		.string()
		.min(1, 'At least one recipient email is required')
		.refine((val) => val.split(',').every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())), {
			message: 'All recipient emails must be valid',
		}),
	recipientName: z.string().min(1, 'Recipient name is required').max(500),
	emailSubject: z.string().min(1, 'Subject is required').max(500),
	emailBody: z.string().max(10000).optional(),
	lockReport: z.boolean().optional(),
	pdfLanguages: z.array(z.enum(['en', 'de'])).optional(),
	// What the composer had on screen. The attachment must match the preview,
	// so the selection travels with the send rather than being re-read from a
	// row the debounced autosave may not have reached yet (ticket 30).
	sections: z.array(z.enum(PDF_SECTIONS)).optional(),
	recipientMode: z.enum(RECIPIENT_MODES).nullable().optional(),
})

type RecipientMode = (typeof RECIPIENT_MODES)[number]

type ExportConfigInput = z.infer<typeof exportConfigSchema>
type SendReportInput = z.infer<typeof sendReportSchema>

export type { ExportConfigInput, RecipientMode, SendReportInput }
export { exportConfigSchema, RECIPIENT_MODES, sendReportSchema }
