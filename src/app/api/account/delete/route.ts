import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GDPR Art. 17 — right to erasure. Deletes:
 *   1. All photo blobs in Supabase Storage under `reports/<id>/`
 *   2. The Prisma User row (cascades to Report → Photo, Calculation, etc.)
 *   3. The Supabase Auth user (revokes the session and prevents re-login)
 *
 * The endpoint is irreversible and is gated behind the user's own auth cookie,
 * so only the account-owner can trigger it. No admin override.
 */
async function DELETE() {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const admin = createAdminClient()

	// 1. Best-effort: remove all photos in storage. The bucket folder layout is
	// `reports/<reportId>/...` so we list each of the user's reports first.
	const reports = await prisma.report.findMany({
		where: { userId: user.id },
		select: { id: true },
	})

	for (const r of reports) {
		const prefix = `reports/${r.id}`
		const { data: list } = await admin.storage.from('photos').list(prefix, { limit: 1000 })
		if (!list || list.length === 0) continue
		const paths: string[] = []
		// Each `list` entry under our prefix may itself be a folder ("photos") that
		// holds variant files. Drill in once.
		for (const entry of list) {
			const sub = await admin.storage
				.from('photos')
				.list(`${prefix}/${entry.name}`, { limit: 1000 })
			if (sub.data) {
				for (const f of sub.data) paths.push(`${prefix}/${entry.name}/${f.name}`)
			}
		}
		if (paths.length > 0) {
			await admin.storage.from('photos').remove(paths)
		}
	}

	// 2. Delete DB rows (cascades through all owned tables).
	await prisma.user.delete({ where: { id: user.id } }).catch(() => {
		// If the Prisma row doesn't exist yet (Supabase user without profile row),
		// continue — the auth delete below is what actually revokes access.
	})

	// 3. Delete the Supabase Auth user (revokes session + blocks re-login).
	const { error: authError } = await admin.auth.admin.deleteUser(user.id)
	if (authError) {
		return NextResponse.json(
			{ error: `Account data was removed but auth deletion failed: ${authError.message}` },
			{ status: 500 },
		)
	}

	return NextResponse.json({ success: true })
}

export { DELETE }
