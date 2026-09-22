import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '../../src/generated/prisma/client.js'

const SUPA_URL = 'http://127.0.0.1:54321'
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP = 'http://localhost:3000'
const IMAGES = '/Users/ivanvukasinovic/Documents/dev/temp/core/testing/testing-images'

const prisma = new PrismaClient()
const admin = createClient(SUPA_URL, SERVICE)
const anon = createClient(SUPA_URL, ANON)

const SENTINEL_PLATE = 'ZZ SENTINEL 1'
const SENTINEL_VIN = 'SENTINELVIN12345X'

function log(...a) {
	console.log(...a)
}

const { data: auth, error: authErr } = await anon.auth.signInWithPassword({
	email: 'ivanvukasino+2@gmail.com',
	password: 'Ivanivan1!',
})
if (authErr) throw authErr
const token = auth.session.access_token
const userId = auth.user.id
log('authenticated as', auth.user.email, userId)

const report = await prisma.report.create({
	data: {
		userId,
		title: 'Untitled Report',
		reportType: 'HS',
		status: 'DRAFT',
	},
})
log('report', report.id)

// Seed the sentinels the guard must protect, BEFORE generate runs.
await prisma.claimantInfo.create({
	data: { reportId: report.id, licensePlate: SENTINEL_PLATE },
})
await prisma.vehicleInfo.create({
	data: { reportId: report.id, vin: SENTINEL_VIN },
})
await prisma.calculation.create({
	data: { reportId: report.id, repairMethod: 'SENTINEL METHOD', damageClass: 'SENTINEL-IX' },
})
log('sentinels seeded: claimantLicensePlate, vin, repairMethod, damageClass')

const files = ['car1.png', 'car2.png', 'car3.png']
for (const [i, name] of files.entries()) {
	const buf = readFileSync(`${IMAGES}/${name}`)
	const path = `${userId}/${report.id}/${Date.now()}-${name}`
	const { error } = await admin.storage
		.from('photos')
		.upload(path, buf, { contentType: 'image/png', upsert: true })
	if (error) throw error
	const { data } = admin.storage.from('photos').getPublicUrl(path)
	await prisma.photo.create({
		data: {
			reportId: report.id,
			url: data.publicUrl,
			aiUrl: data.publicUrl,
			previewUrl: data.publicUrl,
			filename: name,
			order: i,
			contentHash: createHash('sha256').update(buf).digest('hex'),
			type: 'OTHER',
		},
	})
	log('uploaded', name)
}

// @supabase/ssr stores the whole session as a base64- prefixed JSON cookie,
// named after the project ref taken from the Supabase URL host.
const projectRef = new URL(SUPA_URL).hostname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '')
const sessionJson = JSON.stringify(auth.session)
const cookieValue = `base64-${Buffer.from(sessionJson).toString('base64url')}`
const chunks = []
for (let i = 0; i < cookieValue.length; i += 3200) {
	chunks.push(cookieValue.slice(i, i + 3200))
}
const cookieName = `sb-${projectRef}-auth-token`
const cookieHeader =
	chunks.length === 1
		? `${cookieName}=${chunks[0]}`
		: chunks.map((c, i) => `${cookieName}.${i}=${c}`).join('; ')

log('cookie name', cookieName, 'chunks', chunks.length)

log('\n--- running generate ONCE ---')
const res = await fetch(`${APP}/api/reports/${report.id}/generate`, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Cookie: `${cookieHeader}; NEXT_LOCALE=en`,
	},
	body: JSON.stringify({ incremental: false }),
})
log('status', res.status)
if (res.status !== 200) {
	log(await res.text())
	process.exit(1)
}
const text = await res.text()
for (const line of text.split('\n')) {
	if (!line.startsWith('data: ')) continue
	const ev = JSON.parse(line.slice(6))
	if (ev.type === 'auto_fill') log('auto_fill', ev.section, JSON.stringify(ev.fields))
	if (ev.type === 'complete') log('summary', JSON.stringify(ev.summary, null, 2))
	if (ev.type === 'error') log('ERROR', ev.message)
}

log('\n--- post-generate DB state ---')
const after = await prisma.report.findUnique({
	where: { id: report.id },
	include: {
		claimantInfo: true,
		vehicleInfo: true,
		calculation: true,
		condition: true,
	},
})
const ci = after.claimantInfo
const vi = after.vehicleInfo
const ca = after.calculation
const co = after.condition

const checks = [
	['claimantLicensePlate sentinel survived', ci?.licensePlate === SENTINEL_PLATE, ci?.licensePlate],
	['vin sentinel survived', vi?.vin === SENTINEL_VIN, vi?.vin],
	['repairMethod sentinel survived', ca?.repairMethod === 'SENTINEL METHOD', ca?.repairMethod],
	['damageClass sentinel survived', ca?.damageClass === 'SENTINEL-IX', ca?.damageClass],
]
for (const [name, ok, actual] of checks) {
	log(`${ok ? 'PASS' : 'FAIL'}  ${name} → ${JSON.stringify(actual)}`)
}

log('\nfilled-where-empty:')
log(
	JSON.stringify(
		{
			vehicleInfo: {
				manufacturer: vi?.manufacturer,
				mainType: vi?.mainType,
				vehicleType: vi?.vehicleType,
				motorType: vi?.motorType,
				powerKw: vi?.powerKw,
				engineDisplacementCcm: vi?.engineDisplacementCcm,
				kbaNumber: vi?.kbaNumber,
				firstRegistration: vi?.firstRegistration,
				lastRegistration: vi?.lastRegistration,
			},
			claimantInfo: { firstName: ci?.firstName, lastName: ci?.lastName, city: ci?.location },
			calculation: {
				wheelAlignment: ca?.wheelAlignment,
				bodyMeasurements: ca?.bodyMeasurements,
				bodyPaint: ca?.bodyPaint,
				risks: ca?.risks,
				repairTimeDays: ca?.repairTimeDays,
			},
			condition: {
				vehicleColor: co?.vehicleColor,
				generalCondition: co?.generalCondition,
				bodyCondition: co?.bodyCondition,
				paintCondition: co?.paintCondition,
				interiorCondition: co?.interiorCondition,
				drivingAbility: co?.drivingAbility,
				nextMot: co?.nextMot,
				mileageRead: co?.mileageRead,
			},
		},
		null,
		2,
	),
)

log('\nreportId=' + report.id)
await prisma.$disconnect()
