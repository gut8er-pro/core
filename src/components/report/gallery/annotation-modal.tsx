'use client'

import type * as fabric from 'fabric'
import { ChevronLeft, ChevronRight, Edit, Image as ImageIcon, Trash2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Photo } from '@/hooks/use-photos'
import { AnnotationCanvas, type SelectionBox } from './annotation-canvas'
import { type AnnotationTool, AnnotationToolbar } from './annotation-toolbar'
import { useAnnotationSave } from './use-annotation-save'

type AnnotationModalProps = {
	photo: Photo | null
	photos?: Photo[]
	reportId: string
	open: boolean
	locked?: boolean
	onClose: () => void
	onNavigate?: (photoId: string) => void
}

function AnnotationModal({
	photo,
	photos,
	reportId,
	open,
	locked = false,
	onClose,
	onNavigate,
}: AnnotationModalProps) {
	const t = useTranslations('report')
	const tc = useTranslations('common')
	const [activeTool, setActiveTool] = useState<AnnotationTool>('select')
	const [activeColor, setActiveColor] = useState('#FF0000')
	const [description, setDescription] = useState<string | null>(null)
	const [isEditingDescription, setIsEditingDescription] = useState(false)
	const [editDescriptionValue, setEditDescriptionValue] = useState('')
	const [portalHost, setPortalHost] = useState<HTMLElement | null>(null)
	const [selection, setSelection] = useState<SelectionBox | null>(null)
	const [canvasReady, setCanvasReady] = useState(false)
	const canvasRef = useRef<fabric.Canvas | null>(null)
	const exportFnRef = useRef<(() => string | null) | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const { status: saveStatus, save, reset: resetSaveStatus } = useAnnotationSave(reportId)

	const handleCanvasReady = useCallback((canvas: fabric.Canvas, exportFn: () => string | null) => {
		canvasRef.current = canvas
		exportFnRef.current = exportFn
		setCanvasReady(true)
	}, [])

	const handleClearAll = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		canvas.discardActiveObject()
		for (const obj of canvas.getObjects()) {
			canvas.remove(obj)
		}
		canvas.renderAll()
		setSelection(null)
	}, [])

	const handleDeleteSelected = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const active = canvas.getActiveObjects()
		if (active.length === 0) return

		for (const obj of active) {
			canvas.remove(obj)
		}
		canvas.discardActiveObject()
		canvas.renderAll()
		setSelection(null)
	}, [])

	const handleSave = useCallback(async () => {
		const canvas = canvasRef.current
		if (!canvas || !photo || locked) return

		canvas.discardActiveObject()
		canvas.renderAll()

		const hasObjects = canvas.getObjects().length > 0
		const dataUrl = hasObjects ? (exportFnRef.current?.() ?? null) : null
		const json = canvas.toJSON() as Record<string, unknown>

		const succeeded = await save({ photoId: photo.id, fabricJson: json, dataUrl })
		if (succeeded) {
			onClose()
		}
	}, [locked, onClose, photo, save])

	const handleClose = useCallback(() => {
		canvasRef.current = null
		exportFnRef.current = null
		setSelection(null)
		setCanvasReady(false)
		resetSaveStatus()
		onClose()
	}, [onClose, resetSaveStatus])

	// Navigating to another photo remounts the canvas, so the editor is not ready again
	// until that canvas hands itself over.
	// biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the photo, not its fields
	useEffect(() => {
		setCanvasReady(false)
		setSelection(null)
	}, [photo?.id])

	useEffect(() => {
		if (!open) return

		const host = document.createElement('div')
		document.body.appendChild(host)
		const behind = Array.from(document.body.children).filter((element) => element !== host)
		const previousAriaHidden = behind.map((element) => element.getAttribute('aria-hidden'))
		for (const element of behind) {
			element.setAttribute('inert', '')
			element.setAttribute('aria-hidden', 'true')
		}
		setPortalHost(host)

		return () => {
			behind.forEach((element, index) => {
				element.removeAttribute('inert')
				const restored = previousAriaHidden[index]
				if (restored === null || restored === undefined) {
					element.removeAttribute('aria-hidden')
				} else {
					element.setAttribute('aria-hidden', restored)
				}
			})
			host.remove()
			setPortalHost(null)
		}
	}, [open])

	useEffect(() => {
		const container = containerRef.current
		if (!portalHost || !container) return

		container.focus()

		function trapFocus(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				handleClose()
				return
			}

			if (event.key === 'Delete' || event.key === 'Backspace') {
				const target = event.target as HTMLElement | null
				const isTextEntry =
					target?.tagName === 'INPUT' ||
					target?.tagName === 'TEXTAREA' ||
					target?.isContentEditable === true
				if (!isTextEntry && !locked) {
					event.preventDefault()
					handleDeleteSelected()
				}
				return
			}

			if (event.key !== 'Tab' || !container) return

			const focusable = Array.from(
				container.querySelectorAll<HTMLElement>(
					'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
				),
			).filter((element) => element.offsetParent !== null || element === document.activeElement)
			const first = focusable[0]
			const last = focusable[focusable.length - 1]
			if (!first || !last) {
				event.preventDefault()
				return
			}

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault()
				last.focus()
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault()
				first.focus()
			}
		}

		container.addEventListener('keydown', trapFocus)
		return () => container.removeEventListener('keydown', trapFocus)
	}, [portalHost, handleClose, handleDeleteSelected, locked])

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

	if (!photo || !open || !portalHost) return null

	// Build initial annotations from the photo's annotation data
	const initialAnnotations = getInitialAnnotations(photo)
	const photoDescription = description ?? photo.aiDescription ?? null

	// Format upload date
	const uploadDate = photo.uploadedAt
		? new Date(photo.uploadedAt).toLocaleDateString('de-DE', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
			}) +
			' - ' +
			new Date(photo.uploadedAt).toLocaleTimeString('de-DE', {
				hour: '2-digit',
				minute: '2-digit',
			})
		: null

	return createPortal(
		<div
			ref={containerRef}
			role="dialog"
			aria-modal="true"
			aria-label={photo.filename}
			tabIndex={-1}
			className="fixed inset-0 z-50 focus:outline-none"
		>
			{/* Dark overlay */}
			<div
				className="absolute inset-0 bg-black/60"
				onClick={handleClose}
				onKeyDown={(e) => {
					if (e.key === 'Escape') handleClose()
				}}
				role="button"
				tabIndex={-1}
				aria-label={t('gallery.closeModal')}
			/>

			{/* Modal container */}
			<div className="absolute inset-3 top-12 flex flex-col overflow-hidden rounded-2xl bg-surface-secondary shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between px-5 py-3">
					<div className="flex items-center gap-3">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
							<ImageIcon className="h-4 w-4 text-primary" />
						</div>
						<div className="flex flex-col">
							<span className="text-body-sm font-semibold text-black">{photo.filename}</span>
							{uploadDate && <span className="text-caption text-grey-100">{uploadDate}</span>}
						</div>
					</div>
					<button
						type="button"
						onClick={handleClose}
						className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-grey-50 text-grey-100 transition-colors hover:bg-grey-100 hover:text-white"
						aria-label={tc('close')}
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content: Photo + Description */}
				<div className="flex flex-1 min-h-0 gap-5 overflow-hidden px-4 pb-2">
					{/* Photo canvas area */}
					<div className="relative flex-1 min-w-0 overflow-hidden rounded-xl">
						{/* Navigation arrow - left */}
						{hasPrev && (
							<button
								type="button"
								onClick={handlePrev}
								className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl bg-black text-white shadow-md transition-colors hover:bg-black"
								aria-label={t('gallery.previousPhoto')}
							>
								<ChevronLeft className="h-5 w-5" />
							</button>
						)}

						{/* Navigation arrow - right */}
						{hasNext && (
							<button
								type="button"
								onClick={handleNext}
								className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl bg-black text-white shadow-md transition-colors hover:bg-black"
								aria-label={t('gallery.nextPhoto')}
							>
								<ChevronRight className="h-5 w-5" />
							</button>
						)}

						{/* Canvas with image underneath */}
						<AnnotationCanvas
							key={photo.id}
							photoUrl={photo.url}
							activeTool={activeTool}
							activeColor={activeColor}
							initialAnnotations={initialAnnotations}
							readOnly={locked}
							onCanvasReady={handleCanvasReady}
							onSelectionChange={setSelection}
						/>

						{/* Per-marking delete, pinned to the current selection */}
						{selection && !locked && (
							<button
								type="button"
								onClick={handleDeleteSelected}
								aria-label={t('annotation.deleteSelected')}
								style={{
									left: `${selection.left + selection.width / 2}px`,
									top: `${Math.max(selection.top - 40, 4)}px`,
								}}
								className="absolute z-20 flex h-9 w-9 -translate-x-1/2 cursor-pointer items-center justify-center rounded-lg bg-danger text-white shadow-lg transition-colors hover:bg-danger/90"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						)}

						{/* Watermark */}
						<div className="pointer-events-none absolute bottom-4 left-4 z-10">
							<span className="text-body-sm font-bold italic text-white/70">Gut8erPRO</span>
						</div>
					</div>

					{/* Description panel */}
					<div className="hidden w-90 shrink-0 flex-col gap-5 lg:flex">
						<div className="flex items-center justify-between">
							<h3 className="text-input font-medium text-black">{t('gallery.description')}</h3>
						</div>

						{isEditingDescription ? (
							<div className="flex flex-1 flex-col gap-3">
								<textarea
									value={editDescriptionValue}
									onChange={(e) => setEditDescriptionValue(e.target.value)}
									className="flex-1 resize-none rounded-xl border border-border p-4 text-input tracking-[0.18px] text-black focus:border-primary focus:outline-none"
									placeholder="Enter a description..."
								/>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setIsEditingDescription(false)}
										className="flex-1 cursor-pointer rounded-btn border border-border px-3 py-2 text-body-sm text-grey-100 hover:bg-grey-25"
									>
										{tc('cancel')}
									</button>
									<button
										type="button"
										onClick={handleSaveDescription}
										className="flex-1 cursor-pointer rounded-btn bg-primary px-3 py-2 text-body-sm text-white hover:bg-primary-hover"
									>
										{tc('save')}
									</button>
								</div>
							</div>
						) : (
							<div className="relative flex-1">
								{/* Green edit button */}
								<button
									type="button"
									onClick={handleStartEditDescription}
									className="absolute -right-1 -top-1 z-10 flex h-12 w-12 cursor-pointer items-center justify-center rounded-md bg-primary text-white backdrop-blur-sm transition-colors hover:bg-primary-hover"
									aria-label={t('gallery.editDescription')}
								>
									<Edit className="h-6 w-6" />
								</button>

								<div
									className="h-full overflow-y-auto rounded-xl border border-border p-4 text-input leading-relaxed tracking-[0.18px] text-black"
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
										<p className="italic text-grey-100">{t('gallery.noDescription')}</p>
									)}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Floating toolbar at bottom center */}
				<div className="relative z-30 flex flex-col items-center gap-2 py-4">
					{locked && <p className="text-body-sm text-warning-dark">{t('annotation.lockedHint')}</p>}
					<AnnotationToolbar
						activeTool={activeTool}
						activeColor={activeColor}
						onToolChange={setActiveTool}
						onColorChange={setActiveColor}
						onClearAll={handleClearAll}
						onSave={handleSave}
						saveState={saveStatus}
						disabled={locked || !canvasReady}
					/>
				</div>
			</div>
		</div>,
		portalHost,
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

export type { AnnotationModalProps }
export { AnnotationModal }
