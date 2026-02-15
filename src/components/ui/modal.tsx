import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ModalProps = {
	title: string
	open: boolean
	onClose: () => void
	size?: 'sm' | 'md' | 'lg' | 'fullscreen'
	children: ReactNode
	footer?: ReactNode
	className?: string
}

const sizeClasses = {
	sm: 'max-w-sm',
	md: 'max-w-lg',
	lg: 'max-w-3xl md:max-w-full',
	fullscreen: 'h-screen w-screen max-w-none rounded-none',
} as const

function Modal({ title, open, onClose, size = 'md', children, footer, className }: ModalProps) {
	return (
		<DialogPrimitive.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
				<DialogPrimitive.Content
					aria-describedby={undefined}
					className={cn(
						'fixed z-50 bg-white shadow-modal focus:outline-none',
						size === 'fullscreen'
							? 'inset-0'
							: 'left-1/2 top-1/2 w-full -translate-x-1/2 -translate-y-1/2 rounded-xl',
						sizeClasses[size],
						className,
					)}
				>
					<div
						className={cn(
							'flex items-center justify-between border-b border-border',
							size === 'fullscreen' ? 'px-6 py-4' : 'px-6 py-4',
						)}
					>
						<DialogPrimitive.Title className="text-h4 font-semibold text-black">
							{title}
						</DialogPrimitive.Title>
						<DialogPrimitive.Close asChild>
							<button
								type="button"
								className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-grey-100 transition-colors hover:bg-grey-25 hover:text-black"
								aria-label="Close"
							>
								<X className="h-5 w-5" />
							</button>
						</DialogPrimitive.Close>
					</div>

					<div
						className={cn(
							'overflow-auto',
							size === 'fullscreen' ? 'h-[calc(100vh-130px)] p-6' : 'max-h-[60vh] p-6',
						)}
					>
						{children}
					</div>

					{footer && (
						<div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
							{footer}
						</div>
					)}
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	)
}

export { Modal }
export type { ModalProps }
