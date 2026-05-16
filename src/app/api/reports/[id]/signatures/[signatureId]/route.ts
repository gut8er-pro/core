import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'

type RouteContext = {
	params: Promise<{ id: string; signatureId: string }>
}

async function DELETE(_request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const { id, signatureId } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user.id },
		select: { id: true, isLocked: true },
	})
	if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	if (report.isLocked) {
		return NextResponse.json({ error: 'Report is locked' }, { status: 423 })
	}

	const signature = await prisma.signature.findFirst({
		where: { id: signatureId, reportId: id },
		select: { id: true },
	})
	if (!signature) return NextResponse.json({ error: 'Signature not found' }, { status: 404 })

	await prisma.signature.delete({ where: { id: signatureId } })

	return NextResponse.json({ success: true })
}

export { DELETE }
