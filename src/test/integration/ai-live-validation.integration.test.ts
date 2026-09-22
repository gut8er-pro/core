// One live Generate run against the local stack, to prove the never-overwrite
// guard (issue 18) holds against the real pipeline and that the extraction
// fields land where the columns were empty.
//
// This calls the Anthropic API and therefore costs money. It is skipped unless
// AI_LIVE_VALIDATION=1 is set, and it runs exactly one Generate.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { afterAll, describe, expect, it } from 'vitest'
import { prisma } from '@/lib/prisma'

const ENABLED = process.env.AI_LIVE_VALIDATION === '1'
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const IMAGES = 'testing/testing-images'

const SENTINEL_PLATE = 'ZZ SENTINEL 1'
const SENTINEL_VIN = 'SENTINELVIN12345'
const SENTINEL_METHOD = 'SENTINEL METHOD — assessor typed this'
const SENTINEL_CLASS = 'SENTINEL-IX'

let createdReportId: string | null = null

afterAll(async () => {
	if (createdReportId) {
		await prisma.report.delete({ where: { id: createdReportId } }).catch(() => {})
	}
	await prisma.$disconnect()
})

describe.skipIf(!ENABLED)('AI generate — live validation', () => {
	it(
		'pre-fills empty columns and leaves the assessor values untouched',
		async () => {
			const anon = createClient(SUPA_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string)
			const admin = createClient(SUPA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY as string)

			const { data: auth, error: authError } = await anon.auth.signInWithPassword({
				email: 'ivanvukasino+2@gmail.com',
				password: 'Ivanivan1!',
			})
			expect(authError).toBeNull()
			const session = auth.session
			if (!session) throw new Error('no session')
			const userId = auth.user?.id as string

			const report = await prisma.report.create({
				data: { userId, title: 'Untitled Report', reportType: 'HS' },
			})
			createdReportId = report.id

			await prisma.claimantInfo.create({
				data: { reportId: report.id, licensePlate: SENTINEL_PLATE },
			})
			await prisma.vehicleInfo.create({ data: { reportId: report.id, vin: SENTINEL_VIN } })
			await prisma.calculation.create({
				data: {
					reportId: report.id,
					repairMethod: SENTINEL_METHOD,
					damageClass: SENTINEL_CLASS,
				},
			})

			// car4 is a German rear plate carrying an HU-Plakette — the sticker the
			// plate pass now reads for nextMot.
			for (const [i, name] of ['car1.png', 'car2.png', 'car4.png'].entries()) {
				const buf = readFileSync(`${IMAGES}/${name}`)
				const path = `${userId}/${report.id}/${Date.now()}-${name}`
				const { error } = await admin.storage
					.from('photos')
					.upload(path, buf, { contentType: 'image/png', upsert: true })
				expect(error).toBeNull()
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
					},
				})
			}

			const ref = new URL(SUPA_URL).hostname.split('.')[0]?.replace(/[^a-zA-Z0-9]/g, '')
			const cookie = `sb-${ref}-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`

			const res = await fetch(`${APP}/api/reports/${report.id}/generate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Cookie: `${cookie}; NEXT_LOCALE=en` },
				body: JSON.stringify({ incremental: false }),
			})
			expect(res.status).toBe(200)
			const stream = await res.text()
			console.log(
				stream
					.split('\n')
					.filter((l) => l.includes('"auto_fill"') || l.includes('"complete"'))
					.join('\n'),
			)

			const after = await prisma.report.findUnique({
				where: { id: report.id },
				include: { claimantInfo: true, vehicleInfo: true, calculation: true, condition: true },
			})

			// The guard: everything the assessor owned is exactly as they left it.
			expect(after?.claimantInfo?.licensePlate).toBe(SENTINEL_PLATE)
			expect(after?.vehicleInfo?.vin).toBe(SENTINEL_VIN)
			expect(after?.calculation?.repairMethod).toBe(SENTINEL_METHOD)
			expect(after?.calculation?.damageClass).toBe(SENTINEL_CLASS)

			console.log(
				'post-generate columns:',
				JSON.stringify(
					{
						vehicleInfo: after?.vehicleInfo,
						claimantInfo: after?.claimantInfo,
						calculation: after?.calculation,
						condition: after?.condition,
					},
					null,
					2,
				),
			)

			// Something must have been extracted, or the run proves nothing.
			const filled = [
				after?.vehicleInfo?.manufacturer,
				after?.vehicleInfo?.mainType,
				after?.vehicleInfo?.vehicleType,
				after?.condition?.vehicleColor,
				after?.condition?.generalCondition,
				after?.calculation?.risks,
			].filter(Boolean)
			expect(filled.length).toBeGreaterThan(0)

			// Enum columns hold real option values, never raw model prose.
			for (const value of [
				after?.calculation?.wheelAlignment,
				after?.calculation?.bodyMeasurements,
			]) {
				if (value) expect(['required', 'not_required', 'completed']).toContain(value)
			}
			if (after?.calculation?.bodyPaint) {
				expect(['not_required', 'partial', 'full']).toContain(after.calculation.bodyPaint)
			}
			if (after?.vehicleInfo?.vehicleType) {
				expect(['sedan', 'compact', 'suv', 'wagon', 'coupe', 'convertible', 'van']).toContain(
					after.vehicleInfo.vehicleType,
				)
			}
		},
		10 * 60 * 1000,
	)
})
