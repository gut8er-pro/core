import { describe, it, expect, beforeEach } from 'vitest'
import { useSignupStore } from './signup-store'

describe('useSignupStore', () => {
	beforeEach(() => {
		useSignupStore.getState().reset()
	})

	it('has correct initial state', () => {
		const state = useSignupStore.getState()
		expect(state.currentStep).toBe(1)
		expect(state.completedSteps).toEqual([])
		expect(state.account).toEqual({})
		expect(state.personal).toEqual({})
		expect(state.business).toEqual({})
		expect(state.plan).toEqual({ plan: 'pro' })
		expect(state.integrations).toEqual({})
	})

	it('sets account data', () => {
		useSignupStore.getState().setAccount({
			email: 'test@example.com',
			password: 'password123',
			confirmPassword: 'password123',
		})
		expect(useSignupStore.getState().account).toEqual({
			email: 'test@example.com',
			password: 'password123',
			confirmPassword: 'password123',
		})
	})

	it('sets personal data', () => {
		useSignupStore.getState().setPersonal({
			title: 'mr',
			firstName: 'John',
			lastName: 'Doe',
			phone: '+4917612345',
		})
		const state = useSignupStore.getState()
		expect(state.personal.firstName).toBe('John')
		expect(state.personal.lastName).toBe('Doe')
	})

	it('sets business data', () => {
		useSignupStore.getState().setBusiness({
			companyName: 'Test GmbH',
			street: 'Musterstraße 1',
			postcode: '28195',
			city: 'Bremen',
			taxId: '12/345/67890',
		})
		expect(useSignupStore.getState().business.companyName).toBe('Test GmbH')
	})

	it('sets plan data', () => {
		useSignupStore.getState().setPlan({ plan: 'free' })
		expect(useSignupStore.getState().plan.plan).toBe('free')
	})

	it('sets integrations data', () => {
		useSignupStore.getState().setIntegrations({
			provider: 'dat',
			username: 'user123',
		})
		expect(useSignupStore.getState().integrations.provider).toBe('dat')
	})

	it('sets current step', () => {
		useSignupStore.getState().setCurrentStep(3)
		expect(useSignupStore.getState().currentStep).toBe(3)
	})

	it('completes a step', () => {
		useSignupStore.getState().completeStep(1)
		expect(useSignupStore.getState().completedSteps).toEqual([1])
	})

	it('does not add duplicate completed steps', () => {
		useSignupStore.getState().completeStep(1)
		useSignupStore.getState().completeStep(1)
		expect(useSignupStore.getState().completedSteps).toEqual([1])
	})

	it('tracks multiple completed steps', () => {
		useSignupStore.getState().completeStep(1)
		useSignupStore.getState().completeStep(2)
		useSignupStore.getState().completeStep(3)
		expect(useSignupStore.getState().completedSteps).toEqual([1, 2, 3])
	})

	it('resets to initial state', () => {
		useSignupStore.getState().setCurrentStep(4)
		useSignupStore.getState().completeStep(1)
		useSignupStore.getState().completeStep(2)
		useSignupStore.getState().setAccount({ email: 'test@example.com' })
		useSignupStore.getState().reset()

		const state = useSignupStore.getState()
		expect(state.currentStep).toBe(1)
		expect(state.completedSteps).toEqual([])
		expect(state.account).toEqual({})
	})

	it('merges partial data on successive updates', () => {
		useSignupStore.getState().setAccount({ email: 'test@example.com' })
		useSignupStore.getState().setAccount({ password: 'newpass123' })
		const state = useSignupStore.getState()
		expect(state.account.email).toBe('test@example.com')
		expect(state.account.password).toBe('newpass123')
	})
})
