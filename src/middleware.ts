import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

async function middleware(request: NextRequest) {
	return updateSession(request)
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for:
		 * - _next/static (static files)
		 * - _next/image (image optimization)
		 * - favicon.ico (favicon)
		 * - robots.txt / sitemap.xml (crawler metadata — these are served to
		 *   signed-out crawlers, so auth-gating them would 307 them to /login
		 *   and the robots directives would never be read)
		 * - public folder files (images, etc.)
		 */
		'/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
}

export { middleware }
