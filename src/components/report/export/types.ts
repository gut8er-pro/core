import type { RecipientMode } from '@/lib/validations/export'

type ExportFormData = {
	includeValuation: boolean
	includeCommission: boolean
	includeInvoice: boolean
	lockReport: boolean
	pdfLanguages: ('en' | 'de')[]
	recipients: string[]
	recipientMode: RecipientMode | null
	emailSubject: string
	emailBody: string
}

export type { ExportFormData, RecipientMode }
