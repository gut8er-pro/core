/**
 * The Settings → Templates endpoints, against a real database.
 *
 * The thing worth proving here is the part a unit test cannot: that a template
 * written by one user is invisible to another, and that a reload gets back what
 * was saved. Every query the routes make is scoped by `userId`, so the tests run
 * two throwaway users and swap the authenticated one between calls.
 *
 * Requires DATABASE_URL and a database migrated to the current schema; skipped
 * otherwise. Both users are deleted afterwards and their templates cascade.
 *
 * @vitest-environment node
 */

import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { prisma } from '@/lib/prisma'

const session = vi.hoisted(() => ({ userId: '' }))

vi.mock('@/lib/api/auth', () => ({
	getAuthenticatedUser: async () => ({ user: { id: session.userId }, error: null }),
	unauthorizedResponse: () => new Response(null, { status: 401 }),
}))

const { GET, POST } = await import('@/app/api/settings/templates/route')
const { DELETE, PATCH } = await import('@/app/api/settings/templates/[id]/route')

type TemplatePayload = {
	id: string
	subject: string
	body: string
	createdAt: string
	updatedAt: string
}

const describeWithDb = process.env.DATABASE_URL ? describe : describe.skip

describeWithDb('settings templates API', () => {
	let ownerId: string
	let strangerId: string

	beforeAll(async () => {
		const owner = await prisma.user.create({
			data: { email: `templates-owner-${randomUUID()}@gut8erpro.test` },
		})
		const stranger = await prisma.user.create({
			data: { email: `templates-stranger-${randomUUID()}@gut8erpro.test` },
		})
		ownerId = owner.id
		strangerId = stranger.id
	})

	afterAll(async () => {
		await prisma.user.deleteMany({ where: { id: { in: [ownerId, strangerId] } } })
	})

	function authenticateAs(userId: string) {
		session.userId = userId
	}

	function createRequest(payload: unknown) {
		return new NextRequest('http://localhost/api/settings/templates', {
			method: 'POST',
			body: JSON.stringify(payload),
		})
	}

	function patchRequest(payload: unknown) {
		return new NextRequest('http://localhost/api/settings/templates/x', {
			method: 'PATCH',
			body: JSON.stringify(payload),
		})
	}

	function routeContext(id: string) {
		return { params: Promise.resolve({ id }) }
	}

	async function createTemplate(userId: string, subject: string, body: string) {
		authenticateAs(userId)
		const response = await POST(createRequest({ subject, body }))
		const payload = (await response.json()) as { template: TemplatePayload }
		return payload.template
	}

	it('creates a template and hands back the saved row', async () => {
		authenticateAs(ownerId)

		const response = await POST(
			createRequest({
				subject: 'Gutachten fertiggestellt',
				body: 'Sehr geehrte Damen und Herren,',
			}),
		)

		expect(response.status).toBe(201)

		const { template } = (await response.json()) as { template: TemplatePayload }
		expect(template.id).toBeTruthy()
		expect(template.subject).toBe('Gutachten fertiggestellt')
		expect(template.body).toBe('Sehr geehrte Damen und Herren,')
		expect(typeof template.createdAt).toBe('string')
		expect(typeof template.updatedAt).toBe('string')
		expect(Object.keys(template).sort()).toEqual([
			'body',
			'createdAt',
			'id',
			'subject',
			'updatedAt',
		])

		const stored = await prisma.emailTemplate.findUnique({ where: { id: template.id } })
		expect(stored?.userId).toBe(ownerId)
	})

	it('lists only the templates belonging to the authenticated user', async () => {
		const mine = await createTemplate(ownerId, 'Meine Vorlage', 'Mein Text')
		const theirs = await createTemplate(strangerId, 'Fremde Vorlage', 'Fremder Text')

		authenticateAs(ownerId)
		const response = await GET()
		expect(response.status).toBe(200)

		const { templates } = (await response.json()) as { templates: TemplatePayload[] }
		const ids = templates.map((template) => template.id)
		expect(ids).toContain(mine.id)
		expect(ids).not.toContain(theirs.id)
	})

	it('updates a template and leaves the untouched field alone', async () => {
		const template = await createTemplate(ownerId, 'Alter Betreff', 'Alter Text')

		authenticateAs(ownerId)
		const response = await PATCH(
			patchRequest({ subject: 'Neuer Betreff' }),
			routeContext(template.id),
		)

		expect(response.status).toBe(200)

		const { template: updated } = (await response.json()) as { template: TemplatePayload }
		expect(updated.subject).toBe('Neuer Betreff')
		expect(updated.body).toBe('Alter Text')
		expect(updated.id).toBe(template.id)
	})

	it('deletes a template', async () => {
		const template = await createTemplate(ownerId, 'Zu löschen', 'Text')

		authenticateAs(ownerId)
		const response = await DELETE(
			new NextRequest('http://localhost/api/settings/templates/x', { method: 'DELETE' }),
			routeContext(template.id),
		)

		expect(response.status).toBe(200)
		expect(await response.json()).toEqual({ success: true })
		expect(await prisma.emailTemplate.findUnique({ where: { id: template.id } })).toBeNull()
	})

	it('refuses to update a template belonging to someone else', async () => {
		const template = await createTemplate(strangerId, 'Fremde Vorlage', 'Fremder Text')

		authenticateAs(ownerId)
		const response = await PATCH(patchRequest({ subject: 'Gekapert' }), routeContext(template.id))

		expect(response.status).toBe(404)

		const stored = await prisma.emailTemplate.findUnique({ where: { id: template.id } })
		expect(stored?.subject).toBe('Fremde Vorlage')
	})

	it('refuses to delete a template belonging to someone else', async () => {
		const template = await createTemplate(strangerId, 'Nicht anfassen', 'Fremder Text')

		authenticateAs(ownerId)
		const response = await DELETE(
			new NextRequest('http://localhost/api/settings/templates/x', { method: 'DELETE' }),
			routeContext(template.id),
		)

		expect(response.status).toBe(404)
		expect(await prisma.emailTemplate.findUnique({ where: { id: template.id } })).not.toBeNull()
	})

	it('answers 404 for a template id that does not exist', async () => {
		authenticateAs(ownerId)

		const response = await DELETE(
			new NextRequest('http://localhost/api/settings/templates/x', { method: 'DELETE' }),
			routeContext(randomUUID()),
		)

		expect(response.status).toBe(404)
	})

	it('rejects a create without a subject', async () => {
		authenticateAs(ownerId)

		const response = await POST(createRequest({ subject: '', body: 'Text ohne Betreff' }))

		expect(response.status).toBe(400)

		const payload = (await response.json()) as { error: string }
		expect(payload.error).toBe('Invalid input')
	})

	it('rejects an update that would clear the subject', async () => {
		const template = await createTemplate(ownerId, 'Bleibt', 'Text')

		authenticateAs(ownerId)
		const response = await PATCH(patchRequest({ subject: '' }), routeContext(template.id))

		expect(response.status).toBe(400)

		const stored = await prisma.emailTemplate.findUnique({ where: { id: template.id } })
		expect(stored?.subject).toBe('Bleibt')
	})
})
