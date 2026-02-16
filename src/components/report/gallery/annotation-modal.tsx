'use client'

import { useState, useRef, useCallback } from 'react'
import type * as fabric from 'fabric'
import { ChevronLeft, ChevronRight, Image as ImageIcon, X, Pencil } from 'lucide-react'
import type { Photo } from '@/hooks/use-photos'
import { AnnotationToolbar, type AnnotationTool } from './annotation-toolbar'
import { AnnotationCanvas } from './annotation-canvas'

type AnnotationModalProps = {
	photo: Photo | null
	photos?: Photo[]
	open: boolean
	onClose: () => void
	onSave?: (fabricJson: Record<string, unknown>) => void
	onNavigate?: (photoId: string) => void
}

function AnnotationModal({ photo, photos, open, onClose, onSave, onNavigate }: AnnotationModalProps) {
	const [activeTool, setActiveTool] = useState<AnnotationTool>('pen')
	const [activeColor, setActiveColor] = useState('#FF0000')
	const [description, setDescription] = useState<string | null>(null)
	const [isEditingDescription, setIsEditingDescription] = useState(false)
	const [editDescriptionValue, setEditDescriptionValue] = useState('')
	const canvasRef = useRef<fabric.Canvas | null>(null)

	const handleCanvasReady = useCallback((canvas: fabric.Canvas) => {
		canvasRef.current = canvas
	}, [])

	const handleClear = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const objects = canvas.getObjects()
		for (const obj of objects) {
			canvas.remove(obj)
		}
		canvas.renderAll()
	}, [])

	const handleSave = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas || !onSave) return

		const json = canvas.toJSON() as Record<string, unknown>
		onSave(json)
		onClose()
	}, [onSave, onClose])

	const handleClose = useCallback(() => {
		canvasRef.current = null
		onClose()
	}, [onClose])

	const handleStartEditDescription = useCallback(() => {
		setEditDescriptionValue(description ?? photo?.aiDescription ?? '')
		setIsEditingDescription(true)
	}, [description, photo])

	const handleSaveDescription = useCallback(() => {
		setDescription(editDescriptionValue)
		setIsEditingDescription(false)
	}, [editDescriptionValue])

	// Photo navigation
	const currentIndex = photos && photo ? photos.findIndex((p) => p.id === photo.id) : -1
	const hasPrev = currentIndex > 0
	const hasNext = photos ? currentIndex < photos.length - 1 : false

	const handlePrev = useCallback(() => {
		if (!photos || !hasPrev || !onNavigate) return
		const prevPhoto = photos[currentIndex - 1]
		if (prevPhoto) onNavigate(prevPhoto.id)
	}, [photos, currentIndex, hasPrev, onNavigate])

	const handleNext = useCallback(() => {
		if (!photos || !hasNext || !onNavigate) return
		const nextPhoto = photos[currentIndex + 1]
		if (nextPhoto) onNavigate(nextPhoto.id)
	}, [photos, currentIndex, hasNext, onNavigate])

	if (!photo || !open) return null

	// Build initial annotations from the photo's annotation data
	const initialAnnotations = getInitialAnnotations(photo)
	const photoDescription = description ?? photo.aiDescription ?? null

	// Format upload date
	const uploadDate = photo.uploadedAt
		? new Date(photo.uploadedAt).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		}) + ' - ' + new Date(photo.uploadedAt).toLocaleTimeString('de-DE', {
			hour: '2-digit',
			minute: '2-digit',
		})
		: null

	return (
		<div className="fixed inset-0 z-50">
			{/* Dark overlay */}
			<div
				className="absolute inset-0 bg-black/60"
				onClick={handleClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') handleClose()
				}}
				role="button"
				tabIndex={-1}
				aria-label="Close modal"
			/>

			{/* Modal container */}
			<div className="absolute inset-3 top-12 flex flex-col overflow-hidden rounded-2xl bg-[#f5f5f5] shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between px-5 py-3">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
							<ImageIcon className="h-4 w-4 text-primary" />
						</div>
						<div className="flex flex-col">
							<span className="text-body-sm font-semibold text-black">{photo.filename}</span>
							{uploadDate && (
								<span className="text-caption text-grey-100">{uploadDate}</span>
							)}
						</div>
					</div>
					<button
						type="button"
						onClick={handleClose}
						className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-grey-50 text-grey-100 transition-colors hover:bg-grey-100 hover:text-white"
						aria-label="Close"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content: Photo + Description */}
				<div className="flex flex-1 min-h-0">
					{/* Photo canvas area */}
					<div className="relative flex-1 min-w-0">
						{/* Navigation arrow - left */}
						{hasPrev && (
							<button
								type="button"
								onClick={handlePrev}
								className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl bg-[#121312] text-white shadow-md transition-colors hover:bg-black"
								aria-label="Previous photo"
							>
								<ChevronLeft className="h-5 w-5" />
							</button>
						)}

						{/* Navigation arrow - right */}
						{hasNext && (
							<button
								type="button"
								onClick={handleNext}
								className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl bg-[#121312] text-white shadow-md transition-colors hover:bg-black"
								aria-label="Next photo"
							>
								<ChevronRight className="h-5 w-5" />
							</button>
						)}

						{/* Green save/edit button - top right of photo */}
						<button
							type="button"
							onClick={handleSave}
							className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-primary text-white shadow-md transition-colors hover:bg-primary/90"
							aria-label="Save annotations"
						>
							<Pencil className="h-4 w-4 text-white" />
						</button>

						{/* Canvas */}
						<AnnotationCanvas
							photoUrl={photo.previewUrl ?? photo.url}
							activeTool={activeTool}
							activeColor={activeColor}
							initialAnnotations={initialAnnotations}
							onCanvasReady={handleCanvasReady}
						/>

						{/* Watermark */}
						<div className="pointer-events-none absolute bottom-4 left-4 z-10">
							<span className="text-body-sm font-bold italic text-white/70">Gut8erPRO</span>
						</div>
					</div>

					{/* Description panel */}
					<div className="hidden w-70 shrink-0 flex-col border-l border-border bg-white p-5 lg:flex">
						<h3 className="mb-4 text-body font-semibold text-black">Description</h3>

						{isEditingDescription ? (
							<div className="flex flex-1 flex-col gap-3">
								<textarea
									value={editDescriptionValue}
									onChange={(e) => setEditDescriptionValue(e.target.value)}
									className="flex-1 resize-none rounded-lg border border-border bg-grey-25 p-3 text-body-sm text-black focus:border-primary focus:outline-none"
									placeholder="Enter a description..."
									autoFocus
								/>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setIsEditingDescription(false)}
										className="flex-1 cursor-pointer rounded-lg border border-border px-3 py-2 text-body-sm text-grey-100 hover:bg-grey-25"
									>
										Cancel
									</button>
									<button
										type="button"
										onClick={handleSaveDescription}
										className="flex-1 cursor-pointer rounded-lg bg-primary px-3 py-2 text-body-sm text-white hover:bg-primary/90"
									>
										Save
									</button>
								</div>
							</div>
						) : (
							<div
								className="flex-1 cursor-pointer overflow-y-auto text-body-sm leading-relaxed text-black"
								onClick={handleStartEditDescription}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleStartEditDescription()
								}}
								role="button"
								tabIndex={0}
							>
								{photoDescription ? (
									<p className="whitespace-pre-wrap">{photoDescription}</p>
								) : (
									<p className="italic text-grey-100">
										No description available. Run &quot;Generate Report&quot; to analyze this photo, or click to add one.
									</p>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Floating toolbar at bottom center */}
				<div className="flex justify-center py-4">
					<AnnotationToolbar
						activeTool={activeTool}
						activeColor={activeColor}
						onToolChange={setActiveTool}
						onColorChange={setActiveColor}
						onClear={handleClear}
					/>
				</div>
			</div>
		</div>
	)
}

/**
 * Extracts existing Fabric.js JSON data from the photo's annotations.
 */
function getInitialAnnotations(photo: Photo): Record<string, unknown> | undefined {
	if (!photo.annotations || photo.annotations.length === 0) return undefined

	const annotationWithFabricJson = photo.annotations.find(
		(a) => a.fabricJson && Object.keys(a.fabricJson).length > 0,
	)

	if (annotationWithFabricJson?.fabricJson) {
		return annotationWithFabricJson.fabricJson
	}

	return undefined
}

export { AnnotationModal }
export type { AnnotationModalProps }
