import { execSync } from 'node:child_process'

const vercelEnv = process.env.VERCEL_ENV
if (vercelEnv !== 'production') {
	console.log(`[migrate] skipped (VERCEL_ENV=${vercelEnv ?? 'not set'})`)
	process.exit(0)
}

if (!process.env.DATABASE_URL && !process.env.MIGRATE_DATABASE_URL) {
	console.error('[migrate] no DATABASE_URL or MIGRATE_DATABASE_URL set')
	process.exit(1)
}

const url = process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL
execSync('npx prisma migrate deploy', {
	stdio: 'inherit',
	env: { ...process.env, DATABASE_URL: url },
})
