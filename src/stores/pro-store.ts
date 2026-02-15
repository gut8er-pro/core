import { create } from 'zustand'

type ProState = {
	isPro: boolean
	setIsPro: (value: boolean) => void
}

const useProStore = create<ProState>()((set) => ({
	isPro: true,
	setIsPro: (value) => set({ isPro: value }),
}))

/**
 * Convenience hook that returns only the boolean Pro status.
 * Use `useProStore` directly when you need the setter.
 */
function useProStatus(): boolean {
	return useProStore((state) => state.isPro)
}

export { useProStore, useProStatus }
export type { ProState }
