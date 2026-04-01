import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'

async function GET(request: NextRequest) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { searchParams } = new URL(request.url)
	const limit = Math.min(Number(searchParams.get('limit') ?? '50'), 100)

	const notifications = await prisma.notification.findMany({
		where: { userId: user?.id },
		orderBy: { createdAt: 'desc' },
		take: limit,
		select: {
			id: true,
			eventType: true,
			title: true,
			description: true,
			reportId: true,
			isRead: true,
			createdAt: true,
		},
	})

	const unreadCount = await prisma.notification.count({
		where: { userId: user?.id, isRead: false },
	})

	return NextResponse.json({ notifications, unreadCount })
}

async function PATCH() {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	await prisma.notification.updateMany({
		where: { userId: user?.id, isRead: false },
		data: { isRead: true },
	})

	return NextResponse.json({ success: true })
}

export { GET, PATCH }
