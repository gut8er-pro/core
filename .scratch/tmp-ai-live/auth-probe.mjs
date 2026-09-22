import { createClient } from '@supabase/supabase-js'

const SUPA_URL = 'http://127.0.0.1:54321'
const anon = createClient(SUPA_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
const { data: auth, error } = await anon.auth.signInWithPassword({
	email: 'ivanvukasino+2@gmail.com',
	password: 'Ivanivan1!',
})
if (error) throw error

const projectRef = new URL(SUPA_URL).hostname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '')
const cookieValue = `base64-${Buffer.from(JSON.stringify(auth.session)).toString('base64url')}`
const chunks = []
for (let i = 0; i < cookieValue.length; i += 3200) chunks.push(cookieValue.slice(i, i + 3200))
const name = `sb-${projectRef}-auth-token`
const header =
	chunks.length === 1
		? `${name}=${chunks[0]}`
		: chunks.map((c, i) => `${name}.${i}=${c}`).join('; ')

console.log('ref', projectRef, 'chunks', chunks.length)
const res = await fetch('http://localhost:3000/api/reports?page=1&limit=1', {
	headers: { Cookie: header },
})
console.log('GET /api/reports ->', res.status)
console.log((await res.text()).slice(0, 200))
