import { create } from 'zustand'

type ToastType = 'success' | 'error' | 'warning' | 'info'

type Toast = {
	id: string
	type: ToastType
	message: string
	duration?: number
}

type ToastState = {
	toasts: Toast[]
	addToast: (toast: Omit<Toast, 'id'>) => void
	removeToast: (id: string) => void
	success: (message: string, duration?: number) => void
	error: (message: string, duration?: number) => void
	info: (message: string, duration?: number) => void
	warning: (message: string, duration?: number) => void
}

const DEFAULT_DURATION = 5000

let toastCounter = 0

function generateId(): string {
	toastCounter += 1
	return `toast-${toastCounter}-${Date.now()}`
}

const useToastStore = create<ToastState>()((set, get) => ({
	toasts: [],

	addToast: (toast) => {
		const id = generateId()
		const duration = toast.duration ?? DEFAULT_DURATION

		set((state) => ({
			toasts: [...state.toasts, { ...toast, id, duration }],
		}))

		if (duration > 0) {
			setTimeout(() => {
				get().removeToast(id)
			}, duration)
		}
	},

	removeToast: (id) => {
		set((state) => ({
			toasts: state.toasts.filter((t) => t.id !== id),
		}))
	},

	success: (message, duration) => {
		get().addToast({ type: 'success', message, duration })
	},

	error: (message, duration) => {
		get().addToast({ type: 'error', message, duration })
	},

	info: (message, duration) => {
		get().addToast({ type: 'info', message, duration })
	},

	warning: (message, duration) => {
		get().addToast({ type: 'warning', message, duration })
	},
}))

export { useToastStore, DEFAULT_DURATION }
export type { Toast, ToastType, ToastState }
