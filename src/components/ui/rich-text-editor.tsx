import { useState } from 'react'
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	Bookmark,
	Italic,
	List,
	ListOrdered,
	Type,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type RichTextEditorProps = {
	value?: string
	onChange?: (value: string) => void
	placeholder?: string
	className?: string
}

type ToolbarButton = {
	icon: typeof Bold
	label: string
	command: string
}

const toolbarButtons: ToolbarButton[] = [
	{ icon: Type, label: 'Font', command: 'font' },
	{ icon: Bold, label: 'Bold', command: 'bold' },
	{ icon: Italic, label: 'Italic', command: 'italic' },
	{ icon: ListOrdered, label: 'Ordered list', command: 'orderedList' },
	{ icon: List, label: 'Unordered list', command: 'unorderedList' },
	{ icon: AlignLeft, label: 'Align left', command: 'alignLeft' },
	{ icon: AlignCenter, label: 'Align center', command: 'alignCenter' },
	{ icon: AlignRight, label: 'Align right', command: 'alignRight' },
	{ icon: AlignJustify, label: 'Justify', command: 'justify' },
	{ icon: Bookmark, label: 'Bookmark', command: 'bookmark' },
]

function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
	const [content, setContent] = useState(value || '')

	function handleChange(e: React.FormEvent<HTMLDivElement>) {
		const html = e.currentTarget.innerHTML
		setContent(html)
		onChange?.(html)
	}

	return (
		<div className={cn('rounded-lg border border-border', className)}>
			<div
				className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1"
				role="toolbar"
				aria-label="Formatting options"
			>
				{toolbarButtons.map((btn) => {
					const Icon = btn.icon
					return (
						<button
							key={btn.command}
							type="button"
							className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-grey-100 transition-colors hover:bg-grey-25 hover:text-black"
							aria-label={btn.label}
							title={btn.label}
						>
							<Icon className="h-4 w-4" />
						</button>
					)
				})}
			</div>

			<div
				contentEditable
				suppressContentEditableWarning
				onInput={handleChange}
				className="min-h-[200px] p-4 text-body focus:outline-none"
				role="textbox"
				aria-multiline="true"
				aria-label="Email body"
				data-placeholder={placeholder}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: rich text editor content
				dangerouslySetInnerHTML={content ? { __html: content } : undefined}
			/>
		</div>
	)
}

export { RichTextEditor }
export type { RichTextEditorProps }
