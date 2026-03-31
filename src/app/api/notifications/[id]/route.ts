import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'

type RouteContext = { params: Promise<{ id: string }> }

async function PATCH(_request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const notification = await prisma.notification.findFirst({
		where: { id, userId: user!.id },
	})

	if (!notification) {
		return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
	}

	const updated = await prisma.notification.update({
		where: { id },
		data: { isRead: true },
	})

	return NextResponse.json({ notification: updated })
}

export { PATCH }
