import { type NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { prisma } from '@/lib/prisma'
import { updateTemplateSchema } from '@/lib/validations/templates'

type RouteContext = {
	params: Promise<{ id: string }>
}

const templateFields = {
	id: true,
	subject: true,
	body: true,
	createdAt: true,
	updatedAt: true,
} as const

async function PATCH(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const { id } = await context.params

	const existing = await prisma.emailTemplate.findFirst({
		where: { id, userId: user.id },
	})

	if (!existing) {
		return NextResponse.json({ error: 'Template not found' }, { status: 404 })
	}

	const body = await request.json()
	const parsed = updateTemplateSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const template = await prisma.emailTemplate.update({
		where: { id },
		data: parsed.data,
		select: templateFields,
	})

	return NextResponse.json({ template })
}

async function DELETE(_request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error || !user) return unauthorizedResponse()

	const { id } = await context.params

	const existing = await prisma.emailTemplate.findFirst({
		where: { id, userId: user.id },
	})

	if (!existing) {
		return NextResponse.json({ error: 'Template not found' }, { status: 404 })
	}

	await prisma.emailTemplate.delete({ where: { id } })

	return NextResponse.json({ success: true })
}

export { DELETE, PATCH }
