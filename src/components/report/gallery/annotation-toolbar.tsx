'use client'

import {
	MousePointer,
	Pen,
	Circle,
	Square,
	ArrowRight,
	Undo,
	Trash2,
} from 'lucide-react'
import { type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type AnnotationTool = 'pen' | 'circle' | 'rectangle' | 'arrow' | 'select'

type AnnotationToolbarProps = {
	activeColor: string
	activeTool: AnnotationTool
	onColorChange: (color: string) => void
	onToolChange: (tool: AnnotationTool) => void
	onUndo: () => void
	onClear: () => void
	className?: string
}

const TOOLS: { id: AnnotationTool; label: string; icon: ReactNode }[] = [
	{ id: 'select', label: 'Select', icon: <MousePointer className="h-4 w-4" /> },
	{ id: 'pen', label: 'Pen', icon: <Pen className="h-4 w-4" /> },
	{ id: 'circle', label: 'Circle', icon: <Circle className="h-4 w-4" /> },
	{ id: 'rectangle', label: 'Rectangle', icon: <Square className="h-4 w-4" /> },
	{ id: 'arrow', label: 'Arrow', icon: <ArrowRight className="h-4 w-4" /> },
]

const COLOR_PALETTE = [
	'#FF0000',
	'#FF6600',
	'#FFCC00',
	'#33CC33',
	'#16A34A',
	'#0099CC',
	'#0066FF',
	'#6633FF',
	'#CC33CC',
	'#FF3399',
	'#000000',
	'#FFFFFF',
] as const

function AnnotationToolbar({
	activeColor,
	activeTool,
	onColorChange,
	onToolChange,
	onUndo,
	onClear,
	className,
}: AnnotationToolbarProps) {
	return (
		<div
			className={cn(
				'flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white px-4 py-2',
				className,
			)}
		>
			{/* Drawing tools */}
			<div className="flex items-center gap-1">
				{TOOLS.map((tool) => (
					<button
						key={tool.id}
						type="button"
						aria-label={tool.label}
						aria-pressed={activeTool === tool.id}
						onClick={() => onToolChange(tool.id)}
						className={cn(
							'flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors',
							activeTool === tool.id
								? 'bg-primary text-white'
								: 'text-grey-100 hover:bg-grey-25 hover:text-black',
						)}
					>
						{tool.icon}
					</button>
				))}
			</div>

			{/* Divider */}
			<div className="h-6 w-px bg-border" />

			{/* Color palette */}
			<div className="flex items-center gap-1">
				{COLOR_PALETTE.map((color) => (
					<button
						key={color}
						type="button"
						aria-label={`Color ${color}`}
						aria-pressed={activeColor === color}
						onClick={() => onColorChange(color)}
						className={cn(
							'h-6 w-6 cursor-pointer shrink-0 rounded-full border transition-shadow',
							activeColor === color
								? 'ring-2 ring-primary ring-offset-2'
								: 'ring-0',
							color === '#FFFFFF'
								? 'border-grey-50'
								: 'border-transparent',
						)}
						style={{ backgroundColor: color }}
					/>
				))}
			</div>

			{/* Divider */}
			<div className="h-6 w-px bg-border" />

			{/* Undo & Clear actions */}
			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="sm"
					icon={<Undo className="h-4 w-4" />}
					onClick={onUndo}
					aria-label="Undo"
				>
					Undo
				</Button>
				<Button
					variant="ghost"
					size="sm"
					icon={<Trash2 className="h-4 w-4" />}
					onClick={onClear}
					aria-label="Clear all annotations"
				>
					Clear All
				</Button>
			</div>
		</div>
	)
}

export { AnnotationToolbar, COLOR_PALETTE, TOOLS }
export type { AnnotationToolbarProps, AnnotationTool }
