import { afterEach, describe, expect, it } from 'vitest'
import {
	awaitSectionSave,
	hasPendingSectionSave,
	resetSectionSaves,
	trackSectionSave,
} from './section-saves'

function deferred<T>() {
	let resolve!: (value: T) => void
	let reject!: (reason: unknown) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return { promise, resolve, reject }
}

describe('section saves', () => {
	afterEach(() => {
		resetSectionSaves()
	})

	it('resolves immediately when nothing is in flight', async () => {
		await expect(awaitSectionSave('r1', 'calculation')).resolves.toBeUndefined()
	})

	it('blocks a reader until the tracked save settles', async () => {
		const save = deferred<string>()
		trackSectionSave('r1', 'calculation', save.promise)

		let released = false
		const reader = awaitSectionSave('r1', 'calculation').then(() => {
			released = true
		})

		await Promise.resolve()
		expect(released).toBe(false)

		save.resolve('ok')
		await reader
		expect(released).toBe(true)
	})

	it('releases readers even when the save rejects', async () => {
		const save = deferred<string>()
		trackSectionSave('r1', 'calculation', save.promise).catch(() => {})

		const reader = awaitSectionSave('r1', 'calculation')
		save.reject(new Error('boom'))

		await expect(reader).resolves.toBeUndefined()
	})

	it('hands the caller the original promise', async () => {
		const tracked = trackSectionSave('r1', 'calculation', Promise.resolve({ ok: true }))
		await expect(tracked).resolves.toEqual({ ok: true })
	})

	it('does not block a different report or a different section', async () => {
		const save = deferred<string>()
		trackSectionSave('r1', 'calculation', save.promise)

		await expect(awaitSectionSave('r2', 'calculation')).resolves.toBeUndefined()
		await expect(awaitSectionSave('r1', 'invoice')).resolves.toBeUndefined()

		save.resolve('ok')
	})

	it('waits for every save queued on the same section', async () => {
		const first = deferred<string>()
		const second = deferred<string>()

		trackSectionSave('r1', 'calculation', first.promise)
		trackSectionSave('r1', 'calculation', second.promise)

		let released = false
		const reader = awaitSectionSave('r1', 'calculation').then(() => {
			released = true
		})

		first.resolve('one')
		await Promise.resolve()
		expect(released).toBe(false)

		second.resolve('two')
		await reader
		expect(released).toBe(true)
		expect(hasPendingSectionSave('r1', 'calculation')).toBe(false)
	})

	it('clears the entry once the save settles', async () => {
		const save = deferred<string>()
		trackSectionSave('r1', 'calculation', save.promise)
		expect(hasPendingSectionSave('r1', 'calculation')).toBe(true)

		save.resolve('ok')
		await awaitSectionSave('r1', 'calculation')
		expect(hasPendingSectionSave('r1', 'calculation')).toBe(false)
	})
})
