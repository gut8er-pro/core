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

	const { pathname, searchParams } = request.nextUrl

	// Handle Supabase PKCE auth codes — redirect to callback route
	const code = searchParams.get('code')
	if (code && (pathname === '/' || pathname === '/login')) {
		const next = searchParams.get('next') ?? '/dashboard'
		const url = request.nextUrl.clone()
		url.pathname = '/auth/callback'
		url.search = `?code=${code}&next=${encodeURIComponent(next)}`
		return NextResponse.redirect(url)
	}

	// Public routes that don't need auth
	const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/help']
	const isPublicRoute =
		publicRoutes.some((route) => pathname === route || pathname.startsWith('/signup/')) ||
		pathname.startsWith('/auth/callback')

	// Redirect unauthenticated users to login
	if (!user && !isPublicRoute) {
		const url = request.nextUrl.clone()
		url.pathname = '/login'
		return NextResponse.redirect(url)
	}

	// Redirect authenticated users away from auth pages (but allow /signup/complete and /reset-password)
	const isAuthPage =
		pathname === '/login' ||
		pathname === '/forgot-password' ||
		(pathname.startsWith('/signup') && pathname !== '/signup/complete')
	if (user && isAuthPage && pathname !== '/reset-password') {
		const url = request.nextUrl.clone()
		url.pathname = '/dashboard'
		return NextResponse.redirect(url)
	}

	return supabaseResponse
}

export { updateSession }
