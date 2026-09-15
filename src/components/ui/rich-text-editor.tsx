import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	Italic,
	List,
	ListOrdered,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
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
	{ icon: Bold, label: 'Bold', command: 'bold' },
	{ icon: Italic, label: 'Italic', command: 'italic' },
	{ icon: ListOrdered, label: 'Ordered list', command: 'insertOrderedList' },
	{ icon: List, label: 'Unordered list', command: 'insertUnorderedList' },
	{ icon: AlignLeft, label: 'Align left', command: 'justifyLeft' },
	{ icon: AlignCenter, label: 'Align center', command: 'justifyCenter' },
	{ icon: AlignRight, label: 'Align right', command: 'justifyRight' },
	{ icon: AlignJustify, label: 'Justify', command: 'justifyFull' },
]

function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const node = editorRef.current
		if (!node) return
		const next = value ?? ''
		if (next !== node.innerHTML && document.activeElement !== node) {
			node.innerHTML = next
		}
	}, [value])

	function handleInput() {
		const html = editorRef.current?.innerHTML ?? ''
		onChange?.(html)
	}

	function applyCommand(command: string) {
		editorRef.current?.focus()
		document.execCommand(command)
		handleInput()
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
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => applyCommand(btn.command)}
						>
							<Icon className="h-4 w-4" />
						</button>
					)
				})}
			</div>

			<div
				ref={editorRef}
				contentEditable
				suppressContentEditableWarning
				onInput={handleInput}
				className="min-h-[200px] p-4 text-body focus:outline-none"
				role="textbox"
				aria-multiline="true"
				aria-label="Email body"
				data-placeholder={placeholder}
			/>
		</div>
	)
}

export type { RichTextEditorProps }
export { RichTextEditor }
