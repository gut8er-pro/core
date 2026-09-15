import { cookies } from 'next/headers'
import { defaultLocale, LOCALE_COOKIE, type Locale } from '@/i18n/config'
import { resolveLocale } from '@/i18n/translator'

async function requestLocale(): Promise<Locale> {
	try {
		const cookieStore = await cookies()
		return resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value)
	} catch {
		return defaultLocale
	}
}

export { requestLocale }
