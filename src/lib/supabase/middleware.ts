import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

async function updateSession(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request })

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll()
				},
				setAll(cookiesToSet) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value)
					}
					supabaseResponse = NextResponse.next({ request })
					for (const { name, value, options } of cookiesToSet) {
						supabaseResponse.cookies.set(name, value, options)
					}
				},
			},
		},
	)

	const {
		data: { user },
	} = await supabase.auth.getUser()

	const { pathname } = request.nextUrl

	// Public routes that don't need auth
	const publicRoutes = ['/', '/login', '/signup', '/forgot-password']
	const isPublicRoute = publicRoutes.some(
		(route) => pathname === route || pathname.startsWith('/signup/'),
	)

	// Redirect unauthenticated users to login
	if (!user && !isPublicRoute) {
		const url = request.nextUrl.clone()
		url.pathname = '/login'
		return NextResponse.redirect(url)
	}

	// Redirect authenticated users away from auth pages
	if (user && (pathname === '/login' || pathname.startsWith('/signup'))) {
		const url = request.nextUrl.clone()
		url.pathname = '/dashboard'
		return NextResponse.redirect(url)
	}

	return supabaseResponse
}

export { updateSession }
