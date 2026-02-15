import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAuthenticatedUser() {
	const supabase = await createClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()

	if (error || !user) {
		return { user: null, error: 'Unauthorized' }
	}

	return { user, error: null }
}

function unauthorizedResponse() {
	return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export { getAuthenticatedUser, unauthorizedResponse }
