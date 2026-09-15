import { createTranslator } from 'next-intl'
import { defaultLocale, type Locale, locales } from './config'

type TranslateFn = (key: string, values?: Record<string, string | number>) => string

function resolveLocale(value: string | null | undefined): Locale {
	return locales.includes(value as Locale) ? (value as Locale) : defaultLocale
}

/**
 * The same message catalogue the UI reads, outside a React render.
 *
 * Server-written text — notification records, AI prompts and the strings the
 * pipeline streams back — has to reach the user in their language too, and
 * duplicating the catalogue for it is how the two drift apart.
 */
async function getServerTranslations(
	locale: string | null | undefined,
	namespace: string,
): Promise<TranslateFn> {
	const resolved = resolveLocale(locale)
	const messages = (await import(`../messages/${resolved}.json`)).default
	const t = createTranslator({ locale: resolved, messages, namespace })
	return (key, values) => t(key as never, values as never) as string
}

export type { TranslateFn }
export { getServerTranslations, resolveLocale }
