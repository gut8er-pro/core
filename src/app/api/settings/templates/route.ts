import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
import { createTemplateSchema } from '@/lib/validations/templates'

const templateFields = {
	id: true,
	subject: true,
	body: true,
	createdAt: true,
	updatedAt: true,
} as const

async function GET() {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const templates = await prisma.emailTemplate.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: 'desc' },
		select: templateFields,
	})

	return NextResponse.json({ templates })
}

async function POST(request: NextRequest) {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const body = await request.json()
	const parsed = createTemplateSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const template = await prisma.emailTemplate.create({
		data: {
			userId: user.id,
			subject: parsed.data.subject,
			body: parsed.data.body,
		},
		select: templateFields,
	})

	return NextResponse.json({ template }, { status: 201 })
}

export { GET, POST }
