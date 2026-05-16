import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'

/**
 * GDPR Art. 20 — data portability. Returns every database row that references
 * the authenticated user as a single JSON document. The user can then archive
 * it locally before requesting account deletion.
 */
async function GET() {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const profile = await prisma.user.findUnique({
		where: { id: user.id },
		include: {
			business: true,
			integrations: {
				select: { id: true, provider: true, isActive: true, createdAt: true },
			},
			notifications: true,
			reports: {
				include: {
					accidentInfo: true,
					claimantInfo: true,
					opponentInfo: true,
					vehicleInfo: true,
					condition: {
						include: {
							damageMarkers: true,
							paintMarkers: true,
							tireSets: { include: { tires: true } },
						},
					},
					calculation: { include: { additionalCosts: true } },
					visits: true,
					expertOpinion: true,
					signatures: true,
					photos: true,
				},
			},
		},
	})

	if (!profile) {
		return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
	}

	const filename = `gut8erpro-account-export-${user.id}-${new Date().toISOString().slice(0, 10)}.json`
	return new NextResponse(JSON.stringify(profile, null, 2), {
		status: 200,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
		},
	})
}

export { GET }
