'use client'

import { useState, useRef, useEffect, type ReactNode, Fragment } from 'react'
import {
	Paintbrush,
	Crop,
	Circle,
	Square,
	ArrowBigRight,
	Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type AnnotationTool = 'pen' | 'crop' | 'circle' | 'rectangle' | 'arrow'

type AnnotationToolbarProps = {
	activeColor: string
	activeTool: AnnotationTool
	onColorChange: (color: string) => void
	onToolChange: (tool: AnnotationTool) => void
	onClear: () => void
	className?: string
}

const TOOLS: { id: AnnotationTool; label: string; icon: ReactNode }[] = [
	{ id: 'pen', label: 'Draw', icon: <Paintbrush className="h-5 w-5" /> },
	{ id: 'crop', label: 'Crop', icon: <Crop className="h-5 w-5" /> },
	{ id: 'circle', label: 'Circle', icon: <Circle className="h-5 w-5" /> },
	{ id: 'rectangle', label: 'Rectangle', icon: <Square className="h-5 w-5" /> },
	{ id: 'arrow', label: 'Arrow', icon: <ArrowBigRight className="h-5 w-5" /> },
]

const COLOR_PALETTE = [
	// Row 1
	'#FF0000', '#FF6B35', '#FFD700', '#16A34A', '#22C55E',
	// Row 2
	'#06B6D4', '#0891B2', '#3B82F6', '#6366F1', '#8B5CF6',
	// Row 3
	'#D946EF', '#EC4899', '#D2A679', '#FFFFFF', '#000000',
] as const

function AnnotationToolbar({
	activeColor,
	activeTool,
	onColorChange,
	onToolChange,
	onClear,
	className,
}: AnnotationToolbarProps) {
	const [showColorPicker, setShowColorPicker] = useState(false)
	const pickerRef = useRef<HTMLDivElement>(null)

	// Close color picker on outside click
	useEffect(() => {
		if (!showColorPicker) return

		function handleClickOutside(e: MouseEvent) {
			if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
				setShowColorPicker(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [showColorPicker])

	return (
		<div className={cn('relative inline-flex', className)} ref={pickerRef}>
			{/* Color picker popup */}
			{showColorPicker && (
				<div className="absolute bottom-full left-0 mb-3 rounded-xl bg-white p-3 shadow-lg border border-border">
					<div className="grid grid-cols-5 gap-2">
						{COLOR_PALETTE.map((color) => (
							<button
								key={color}
								type="button"
								aria-label={`Color ${color}`}
								aria-pressed={activeColor === color}
								onClick={() => {
									onColorChange(color)
									setShowColorPicker(false)
								}}
								className={cn(
									'h-7 w-7 cursor-pointer rounded-full border-2 transition-transform hover:scale-110',
									activeColor === color
										? 'border-primary scale-110'
										: 'border-transparent',
									color === '#FFFFFF' && activeColor !== color && 'border-grey-50',
								)}
								style={{ backgroundColor: color }}
							/>
						))}
					</div>
					{/* Arrow pointing down to toolbar */}
					<div className="absolute -bottom-1.5 left-6 h-3 w-3 rotate-45 border-b border-r border-border bg-white" />
				</div>
			)}

			{/* Toolbar pill */}
			<div className="flex items-center rounded-2xl bg-white px-2 py-1.5 shadow-lg border border-border/50">
				{TOOLS.map((tool, index) => (
					<Fragment key={tool.id}>
						{/* Divider before each tool except the first */}
						{index > 0 && (
							<div className="mx-0.5 h-6 w-px bg-border" />
						)}
						<button
							type="button"
							aria-label={tool.label}
							aria-pressed={activeTool === tool.id}
							onClick={() => {
								onToolChange(tool.id)
								if (tool.id === 'pen') {
									setShowColorPicker((prev) => !prev)
								} else {
									setShowColorPicker(false)
								}
							}}
							className={cn(
								'flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors',
								activeTool === tool.id
									? 'bg-primary/10 text-primary'
									: 'text-grey-100 hover:bg-grey-25 hover:text-black',
							)}
						>
							{tool.icon}
						</button>
					</Fragment>
				))}

				{/* Divider before delete */}
				<div className="mx-0.5 h-6 w-px bg-border" />

				{/* Delete/clear */}
				<button
					type="button"
					aria-label="Delete annotations"
					onClick={onClear}
					className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-grey-100 transition-colors hover:bg-grey-25 hover:text-black"
				>
					<Trash2 className="h-5 w-5" />
				</button>
			</div>
		</div>
	)
}

export { AnnotationToolbar, COLOR_PALETTE, TOOLS }
export type { AnnotationToolbarProps, AnnotationTool }
