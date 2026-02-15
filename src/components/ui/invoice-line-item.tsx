import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type InvoiceLineItemProps = {
	description: string
	specialFeature?: string
	rate: number
	amount: number
	isLumpSum?: boolean
	onDelete?: () => void
	onDescriptionChange?: (value: string) => void
	onRateChange?: (value: number) => void
	editable?: boolean
	className?: string
}

function InvoiceLineItem({
	description,
	specialFeature,
	rate,
	amount,
	isLumpSum,
	onDelete,
	onDescriptionChange,
	onRateChange,
	editable = false,
	className,
}: InvoiceLineItemProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-2 rounded-lg border border-border bg-white p-4 md:flex-row md:items-center md:gap-4',
				className,
			)}
		>
			<div className="flex-1">
				{editable ? (
					<input
						type="text"
						value={description}
						onChange={(e) => onDescriptionChange?.(e.target.value)}
						className="w-full border-0 bg-transparent text-body-sm font-medium text-black focus:outline-none"
						aria-label="Description"
					/>
				) : (
					<p className="text-body-sm font-medium text-black">{description}</p>
				)}
				{specialFeature && (
					<p className="text-caption text-grey-100">{specialFeature}</p>
				)}
			</div>

			<div className="flex items-center gap-4">
				{isLumpSum && (
					<span className="rounded bg-grey-25 px-2 py-0.5 text-caption font-medium text-grey-100">
						Lump Sum
					</span>
				)}

				<div className="w-24 text-right">
					{editable ? (
						<input
							type="number"
							value={rate}
							onChange={(e) => onRateChange?.(Number(e.target.value))}
							className="w-full border-0 bg-transparent text-right text-body-sm text-black focus:outline-none"
							aria-label="Rate"
							step="0.01"
						/>
					) : (
						<span className="text-body-sm text-grey-100">
							{formatEUR(rate)}
						</span>
					)}
				</div>

				<div className="w-28 text-right">
					<span className="text-body-sm font-semibold text-black" aria-label="Amount">
						{formatEUR(amount)}
					</span>
				</div>

				{onDelete && (
					<button
						type="button"
						onClick={onDelete}
						className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-grey-100 transition-colors hover:bg-error-light hover:text-error"
						aria-label="Delete line item"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				)}
			</div>
		</div>
	)
}

function formatEUR(value: number): string {
	return new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
	}).format(value)
}

export { InvoiceLineItem, formatEUR }
export type { InvoiceLineItemProps }
