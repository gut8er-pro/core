import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { PrismaClient } from '@/generated/prisma/client'

const createPrismaClient = () => {
	const connectionString = process.env.DATABASE_URL
	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is not set')
	}
	const sslDisabled = /[?&]sslmode=disable\b/.test(connectionString)
	const pool = new pg.Pool({
		connectionString,
		ssl: sslDisabled ? false : { rejectUnauthorized: false },
		max: 3,
		connectionTimeoutMillis: 10_000,
		idleTimeoutMillis: 30_000,
	})
	pool.on('error', (err) => {
		console.error('[prisma] idle client error:', err.message)
	})
	const adapter = new PrismaPg(pool)
	return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined
}

function getPrisma(): PrismaClient {
	if (!globalForPrisma.prisma) {
		globalForPrisma.prisma = createPrismaClient()
	}
	return globalForPrisma.prisma
}

// Use a Proxy to lazily initialize PrismaClient only when accessed at runtime,
// not during build-time module evaluation.
const prisma = new Proxy({} as PrismaClient, {
	get(_target, prop) {
		return Reflect.get(getPrisma(), prop)
	},
})

export { prisma }
