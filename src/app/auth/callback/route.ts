import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/urls'

async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url)
	const code = searchParams.get('code')
	// `next` arrives from the query string, so it is attacker-controlled.
	const next = safeRedirectPath(searchParams.get('next'), origin)

	if (code) {
		const supabase = await createClient()
		const { error } = await supabase.auth.exchangeCodeForSession(code)
		if (!error) {
			// Ensure the user exists in our database (for OAuth signups)
			const {
				data: { user },
			} = await supabase.auth.getUser()
			if (user) {
				const existing = await prisma.user.findUnique({
					where: { id: user.id },
				})
				if (!existing) {
					await prisma.user.create({
						data: {
							id: user.id,
							email: user.email ?? '',
							firstName: (user.user_metadata?.full_name as string)?.split(' ')[0] ?? null,
							lastName:
								(user.user_metadata?.full_name as string)?.split(' ').slice(1).join(' ') ?? null,
							avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
						},
					})
				}
			}
			return NextResponse.redirect(new URL(next, origin))
		}
	}

	return NextResponse.redirect(new URL('/login?error=auth_callback_error', origin))
}

export { GET }
