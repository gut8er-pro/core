import {
	useQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import type { SettingsUpdateInput } from '@/lib/validations/settings'

type UserSettings = {
	id: string
	email: string
	title: string | null
	firstName: string | null
	lastName: string | null
	phone: string | null
	avatarUrl: string | null
	plan: 'FREE' | 'PRO'
	stripeCustomerId: string | null
	stripeSubscriptionId: string | null
	trialEndsAt: string | null
	business: {
		companyName: string
		street: string
		postcode: string
		city: string
		taxId: string
		vatId: string | null
	} | null
	integrations: Array<{
		id: string
		provider: 'DAT' | 'AUDATEX' | 'GT_MOTIVE'
		isActive: boolean
	}>
}

async function fetchSettings(): Promise<UserSettings> {
	const response = await fetch('/api/settings')
	if (!response.ok) {
		throw new Error('Failed to fetch settings')
	}
	return response.json()
}

async function saveSettings(data: SettingsUpdateInput): Promise<UserSettings> {
	const response = await fetch('/api/settings', {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data),
	})
	if (!response.ok) {
		throw new Error('Failed to save settings')
	}
	return response.json()
}

function useUserSettings() {
	return useQuery({
		queryKey: ['settings'],
		queryFn: fetchSettings,
	})
}

function useSaveSettings() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: saveSettings,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['settings'] })
		},
	})
}

export { useUserSettings, useSaveSettings, fetchSettings, saveSettings }
export type { UserSettings }
