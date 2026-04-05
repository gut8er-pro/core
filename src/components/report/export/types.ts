type ExportFormData = {
	includeValuation: boolean
	includeCommission: boolean
	includeInvoice: boolean
	lockReport: boolean
	pdfLanguages: ('en' | 'de')[]
	recipientEmail: string
	recipientName: string
	emailSubject: string
	emailBody: string
}

export type { ExportFormData }
