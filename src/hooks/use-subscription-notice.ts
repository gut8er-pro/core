'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'

/**
 * The one thing the product says when an AI action is refused for want of a live
 * subscription — that AI needs one, and that the Gutachten already made are untouched.
 *
 * Six handlers can answer 402 and they fail in three different shapes: a thrown
 * `SubscriptionRequiredError` from the AI client, a flag on the generate hook's status,
 * and a bare status check on the auto-fill fetch. Only the sentence has to be the same
 * in all three, so only the sentence lives here. `message` is for the screens that also
 * print it where the failure happened; `notify` is the toast the ticket asked for.
 */
function useSubscriptionNotice(): { message: string; notify: () => void } {
	const toast = useToast()
	const t = useTranslations('toast')
	const message = t('aiSubscriptionRequired')

	const notify = useCallback(() => {
		toast.error(message)
	}, [toast, message])

	return useMemo(() => ({ message, notify }), [message, notify])
}

export { useSubscriptionNotice }
