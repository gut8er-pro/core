/**
 * Query param that asks the dashboard to open its report-type menu on arrival.
 *
 * Report creation has no route of its own — it happens through the menu on the
 * dashboard — so screens that want to send a user straight into "new report"
 * link to `/?new-report=1` instead of a `/reports/new` that does not exist.
 */
const NEW_REPORT_PARAM = 'new-report'

export { NEW_REPORT_PARAM }
