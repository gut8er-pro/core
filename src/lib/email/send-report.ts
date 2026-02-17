import { getResendClient } from './client'

interface SendReportEmailParams {
	to: string
	recipientName: string
	subject: string
	body: string
	reportTitle: string
	senderName: string
	senderCompany?: string
	pdfAttachment?: {
		filename: string
		content: Buffer
	}
}

interface SendReportEmailResult {
	success: boolean
	error?: string
}

function buildReportEmailHtml(params: {
	recipientName: string
	body: string
	reportTitle: string
	senderName: string
	senderCompany?: string
}): string {
	const { recipientName, body, reportTitle, senderName, senderCompany } = params

	const footerLine = senderCompany
		? `${senderName} &mdash; ${senderCompany}`
		: senderName

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${reportTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#16A34A;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">Gut8erPRO</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#18181b;font-size:15px;line-height:1.6;">
                Dear ${recipientName},
              </p>
              <p style="margin:0 0 24px;color:#3f3f46;font-size:14px;line-height:1.6;">
                Please find attached the report: <strong>${reportTitle}</strong>
              </p>
              <!-- User-composed body (rich text HTML) -->
              <div style="margin:0 0 24px;color:#3f3f46;font-size:14px;line-height:1.6;">
                ${body}
              </div>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:0;" />
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0 0 4px;color:#71717a;font-size:13px;line-height:1.5;">
                Sent via Gut8erPRO
              </p>
              <p style="margin:0;color:#71717a;font-size:13px;line-height:1.5;">
                ${footerLine}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function sendReportEmail(
	params: SendReportEmailParams,
): Promise<SendReportEmailResult> {
	const { to, recipientName, subject, body, reportTitle, senderName, senderCompany, pdfAttachment } = params

	const html = buildReportEmailHtml({
		recipientName,
		body,
		reportTitle,
		senderName,
		senderCompany,
	})

	const fromAddress = process.env.RESEND_FROM_ADDRESS ?? 'onboarding@resend.dev'

	try {
		const resend = getResendClient()

		const emailPayload: Parameters<typeof resend.emails.send>[0] = {
			from: `Gut8erPRO <${fromAddress}>`,
			to: [to],
			subject,
			html,
		}

		if (pdfAttachment) {
			emailPayload.attachments = [
				{
					filename: pdfAttachment.filename,
					content: pdfAttachment.content,
				},
			]
		}

		const { error } = await resend.emails.send(emailPayload)

		if (error) {
			return { success: false, error: error.message }
		}

		return { success: true }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown email sending error'
		return { success: false, error: message }
	}
}

export { sendReportEmail }
export type { SendReportEmailParams, SendReportEmailResult }
