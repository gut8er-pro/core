/**
 * Email bodies are built by string interpolation, so everything that reaches
 * them from the database passes through here. The one exception is the
 * assessor's composed body on a Gutachten, which is rich text and intentionally
 * HTML.
 */
function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

export { escapeHtml }
