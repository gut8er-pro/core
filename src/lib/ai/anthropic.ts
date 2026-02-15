import Anthropic from '@anthropic-ai/sdk'

function getAnthropicClient(): Anthropic {
	const key = process.env.ANTHROPIC_API_KEY
	if (!key) throw new Error('Missing ANTHROPIC_API_KEY')
	return new Anthropic({ apiKey: key })
}

export { getAnthropicClient }
