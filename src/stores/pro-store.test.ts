import { describe, it, expect, beforeEach } from 'vitest'
import { useProStore } from './pro-store'

describe('useProStore', () => {
	beforeEach(() => {
		// Reset to default state before each test
		useProStore.setState({ isPro: true })
	})

	it('has correct initial state (all users are Pro)', () => {
		const state = useProStore.getState()
		expect(state.isPro).toBe(true)
	})

	it('sets isPro to true', () => {
		useProStore.getState().setIsPro(true)
		expect(useProStore.getState().isPro).toBe(true)
	})

	it('sets isPro to false', () => {
		useProStore.getState().setIsPro(true)
		expect(useProStore.getState().isPro).toBe(true)

		useProStore.getState().setIsPro(false)
		expect(useProStore.getState().isPro).toBe(false)
	})

	it('toggles isPro back and forth', () => {
		expect(useProStore.getState().isPro).toBe(true)

		useProStore.getState().setIsPro(false)
		expect(useProStore.getState().isPro).toBe(false)

		useProStore.getState().setIsPro(true)
		expect(useProStore.getState().isPro).toBe(true)

		useProStore.getState().setIsPro(false)
		expect(useProStore.getState().isPro).toBe(false)
	})

	it('setting same value does not break state', () => {
		useProStore.getState().setIsPro(false)
		expect(useProStore.getState().isPro).toBe(false)

		useProStore.getState().setIsPro(false)
		expect(useProStore.getState().isPro).toBe(false)
	})

	it('setting true twice keeps true', () => {
		useProStore.getState().setIsPro(true)
		useProStore.getState().setIsPro(true)
		expect(useProStore.getState().isPro).toBe(true)
	})
})
