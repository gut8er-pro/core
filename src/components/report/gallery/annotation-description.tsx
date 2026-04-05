import { Check, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type AnnotationDescriptionProps = {
	description: string | null
	onEdit: (newDescription: string) => void
	className?: string
}

function AnnotationDescription({ description, onEdit, className }: AnnotationDescriptionProps) {
	const t = useTranslations('report')
	const [isEditing, setIsEditing] = useState(false)
	const [editValue, setEditValue] = useState(description ?? '')

	const handleStartEdit = () => {
		setEditValue(description ?? '')
		setIsEditing(true)
	}

	const handleSaveEdit = () => {
		onEdit(editValue)
		setIsEditing(false)
	}

	return (
		<div className={cn('flex flex-col border-l border-border bg-white p-5', className)}>
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-body-sm font-semibold text-black">{t('gallery.description')}</h3>
				<button
					type="button"
					onClick={isEditing ? handleSaveEdit : handleStartEdit}
					className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary/90"
					aria-label={isEditing ? t('annotation.saveDescription') : t('gallery.editDescription')}
				>
					{isEditing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
				</button>
			</div>

			{isEditing ? (
				<textarea
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					className="flex-1 resize-none rounded-md border border-border bg-grey-25 p-3 text-body-sm text-black focus:border-primary focus:outline-none"
					placeholder={t('annotation.enterDescription')}
				/>
			) : description ? (
				<div className="flex-1 overflow-y-auto text-body-sm leading-relaxed text-black whitespace-pre-wrap">
					{description}
				</div>
			) : (
				<p className="flex-1 text-body-sm text-grey-100 italic">
					{t('annotation.noAiDescription')}
				</p>
			)}
		</div>
	)
}

export type { AnnotationDescriptionProps }
export { AnnotationDescription }
