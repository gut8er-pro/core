import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, LOCALE_COOKIE, type Locale, locales } from './config'

export default getRequestConfig(async () => {
	const cookieStore = await cookies()
	const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value

	let locale: Locale = defaultLocale

	if (cookieLocale && locales.includes(cookieLocale as Locale)) {
		locale = cookieLocale as Locale
	} else {
		const headerStore = await headers()
		const acceptLang = headerStore.get('accept-language') ?? ''
		const preferred = acceptLang
			.split(',')
			.map((l) => l.split(';')[0]?.trim().substring(0, 2).toLowerCase())
			.filter(Boolean)
		const match = preferred.find((l) => locales.includes(l as Locale))
		if (match) locale = match as Locale
	}

	const messages = (await import(`../messages/${locale}.json`)).default
	return { locale, messages }
})
