'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore, type Toast, type ToastType } from '@/stores/toast-store'

const ICON_MAP: Record<ToastType, typeof CheckCircle> = {
	success: CheckCircle,
	error: XCircle,
	warning: AlertTriangle,
	info: Info,
}

const STYLE_MAP: Record<ToastType, { container: string; icon: string }> = {
	success: {
		container: 'border-success bg-success-light text-success',
		icon: 'text-success',
	},
	error: {
		container: 'border-error bg-error-light text-error',
		icon: 'text-error',
	},
	warning: {
		container: 'border-warning bg-warning/10 text-warning-orange',
		icon: 'text-warning-orange',
	},
	info: {
		container: 'border-info-blue bg-info-blue/10 text-info-blue',
		icon: 'text-info-blue',
	},
}

function ToastItem({ toast }: { toast: Toast }) {
	const removeToast = useToastStore((state) => state.removeToast)
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		// Trigger slide-in animation on next frame
		const frame = requestAnimationFrame(() => {
			setVisible(true)
		})
		return () => cancelAnimationFrame(frame)
	}, [])

	function handleDismiss() {
		setVisible(false)
		// Wait for slide-out animation to complete before removing
		setTimeout(() => {
			removeToast(toast.id)
		}, 200)
	}

	const Icon = ICON_MAP[toast.type]
	const styles = STYLE_MAP[toast.type]

	return (
		<div
			role="alert"
			className={cn(
				'flex items-start gap-3 rounded-md border px-4 py-3 shadow-card transition-all duration-200 ease-out',
				styles.container,
				visible
					? 'translate-x-0 opacity-100'
					: 'translate-x-full opacity-0',
			)}
		>
			<Icon className={cn('mt-0.5 h-5 w-5 shrink-0', styles.icon)} />
			<p className="flex-1 text-body-sm font-medium">{toast.message}</p>
			<button
				type="button"
				onClick={handleDismiss}
				className="shrink-0 cursor-pointer rounded-sm p-0.5 opacity-70 transition-opacity hover:opacity-100"
				aria-label="Dismiss notification"
			>
				<X className="h-4 w-4" />
			</button>
		</div>
	)
}

function ToastContainer() {
	const toasts = useToastStore((state) => state.toasts)

	if (toasts.length === 0) {
		return null
	}

	return (
		<div
			aria-live="polite"
			aria-label="Notifications"
			className="fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2"
		>
			{toasts.map((toast) => (
				<ToastItem key={toast.id} toast={toast} />
			))}
		</div>
	)
}

export { ToastContainer, ToastItem }
