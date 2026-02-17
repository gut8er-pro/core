import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { settingsUpdateSchema } from '@/lib/validations/settings'

async function GET() {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const dbUser = await prisma.user.findUnique({
		where: { id: user!.id },
		select: {
			id: true,
			email: true,
			title: true,
			firstName: true,
			lastName: true,
			phone: true,
			avatarUrl: true,
			plan: true,
			stripeCustomerId: true,
			stripeSubscriptionId: true,
			trialEndsAt: true,
			business: {
				select: {
					companyName: true,
					street: true,
					postcode: true,
					city: true,
					taxId: true,
					vatId: true,
					logoUrl: true,
				},
			},
			integrations: {
				select: {
					id: true,
					provider: true,
					isActive: true,
				},
			},
		},
	})

	if (!dbUser) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 })
	}

	return NextResponse.json(dbUser)
}

async function PATCH(request: NextRequest) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const body = await request.json()
	const parsed = settingsUpdateSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const { profile, business, integration, logoUrl } = parsed.data

	try {
		// Update profile fields on User model
		if (profile) {
			await prisma.user.update({
				where: { id: user!.id },
				data: {
					title: profile.title,
					firstName: profile.firstName,
					lastName: profile.lastName,
					phone: profile.phone,
				},
			})
		}

		// Update or create Business record
		if (business) {
			await prisma.business.upsert({
				where: { userId: user!.id },
				update: {
					companyName: business.companyName,
					street: business.street,
					postcode: business.postcode,
					city: business.city,
					taxId: business.taxId,
					vatId: business.vatId,
					logoUrl: business.logoUrl,
				},
				create: {
					userId: user!.id,
					companyName: business.companyName,
					street: business.street,
					postcode: business.postcode,
					city: business.city,
					taxId: business.taxId,
					vatId: business.vatId,
					logoUrl: business.logoUrl,
				},
			})
		}

		// Update or create Integration record
		if (integration) {
			const credentials =
				integration.username
					? JSON.stringify({
							username: integration.username,
							password: integration.password,
						})
					: null

			await prisma.integration.upsert({
				where: {
					userId_provider: {
						userId: user!.id,
						provider: integration.provider,
					},
				},
				update: {
					encryptedCredentials: credentials,
					isActive: integration.isActive,
				},
				create: {
					userId: user!.id,
					provider: integration.provider,
					encryptedCredentials: credentials,
					isActive: integration.isActive,
				},
			})
		}

		// Update logo URL on Business record (standalone, no other fields required)
		if (logoUrl !== undefined) {
			await prisma.business.upsert({
				where: { userId: user!.id },
				update: { logoUrl },
				create: {
					userId: user!.id,
					companyName: '',
					street: '',
					postcode: '00000',
					city: '',
					taxId: '',
					logoUrl,
				},
			})
		}

		// Return updated settings
		const updatedUser = await prisma.user.findUnique({
			where: { id: user!.id },
			select: {
				id: true,
				email: true,
				title: true,
				firstName: true,
				lastName: true,
				phone: true,
				avatarUrl: true,
				plan: true,
				stripeCustomerId: true,
				stripeSubscriptionId: true,
				trialEndsAt: true,
				business: {
					select: {
						companyName: true,
						street: true,
						postcode: true,
						city: true,
						taxId: true,
						vatId: true,
						logoUrl: true,
					},
				},
				integrations: {
					select: {
						id: true,
						provider: true,
						isActive: true,
					},
				},
			},
		})

		return NextResponse.json(updatedUser)
	} catch (err) {
		console.error('Settings PATCH error:', err)
		const message = err instanceof Error ? err.message : 'Internal server error'
		return NextResponse.json(
			{ error: message },
			{ status: 500 },
		)
	}
}

export { GET, PATCH }
