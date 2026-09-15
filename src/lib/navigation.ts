/**
 * Query param that asks the dashboard to open its report-type menu on arrival.
 *
 * Report creation has no route of its own — it happens through the menu on the
 * dashboard — so screens that want to send a user straight into "new report"
 * link to `/?new-report=1` instead of a `/reports/new` that does not exist.
 */
const NEW_REPORT_PARAM = 'new-report'

/**
 * Query param Stripe Checkout carries back on its success redirect, and which the
 * signup's completion screen forwards when it hands the user on to the dashboard.
 *
 * It means "this person has just paid, and the webhook that records it may not have
 * landed yet" — see `waitForEntitlement`. It is a hint about timing, never a grant:
 * nothing reads it as entitlement, because anyone can type it into the address bar.
 */
const PAYMENT_PARAM = 'payment'
const PAYMENT_SUCCESS = 'success'

/**
 * Read a query param off the current URL and strip it, without a navigation.
 *
 * Both params above are one-shot instructions to the screen being opened — open the
 * report-type menu, wait for the webhook — and neither should survive a refresh, which
 * would replay an instruction the user did not give twice. Reading and clearing are the
 * same act, so they are one call. Rewrites to `/` because the dashboard is the only
 * screen that carries these; the rest of the query string is preserved.
 */
function consumeQueryParam(param: string): string | null {
	const params = new URLSearchParams(window.location.search)
	const value = params.get(param)
	if (value === null) return null

	params.delete(param)
	const query = params.toString()
	window.history.replaceState(null, '', query ? `/?${query}` : '/')
	return value
}

export { consumeQueryParam, NEW_REPORT_PARAM, PAYMENT_PARAM, PAYMENT_SUCCESS }
