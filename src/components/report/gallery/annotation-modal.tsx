'use client'

import { useState, useRef, useCallback } from 'react'
import type * as fabric from 'fabric'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { Photo } from '@/hooks/use-photos'
import { AnnotationToolbar, type AnnotationTool } from './annotation-toolbar'
import { AnnotationCanvas } from './annotation-canvas'

type AnnotationModalProps = {
	photo: Photo | null
	open: boolean
	onClose: () => void
	onSave?: (fabricJson: Record<string, unknown>) => void
}

function AnnotationModal({ photo, open, onClose, onSave }: AnnotationModalProps) {
	const [activeTool, setActiveTool] = useState<AnnotationTool>('pen')
	const [activeColor, setActiveColor] = useState('#FF0000')
	const canvasRef = useRef<fabric.Canvas | null>(null)

	const handleCanvasReady = useCallback((canvas: fabric.Canvas) => {
		canvasRef.current = canvas
	}, [])

	const handleUndo = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const objects = canvas.getObjects()
		if (objects.length === 0) return

		const lastObject = objects.at(-1)
		if (lastObject) {
			canvas.remove(lastObject)
		}
		canvas.renderAll()
	}, [])

	const handleClear = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		// Remove all objects but keep background image
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

	if (!photo) return null

	// Build initial annotations from the photo's annotation data
	const initialAnnotations = getInitialAnnotations(photo)

	return (
		<Modal
			title={`Annotate: ${photo.filename}`}
			open={open}
			onClose={handleClose}
			size="fullscreen"
			footer={
				<>
					<Button variant="secondary" onClick={handleClose}>
						Cancel
					</Button>
					<Button variant="primary" onClick={handleSave}>
						Save
					</Button>
				</>
			}
		>
			<div className="flex h-full flex-col gap-4">
				<AnnotationToolbar
					activeTool={activeTool}
					activeColor={activeColor}
					onToolChange={setActiveTool}
					onColorChange={setActiveColor}
					onUndo={handleUndo}
					onClear={handleClear}
				/>

				<div className="min-h-0 flex-1">
					<AnnotationCanvas
						photoUrl={photo.previewUrl ?? photo.url}
						activeTool={activeTool}
						activeColor={activeColor}
						initialAnnotations={initialAnnotations}
						onCanvasReady={handleCanvasReady}
					/>
				</div>
			</div>
		</Modal>
	)
}

/**
 * Extracts existing Fabric.js JSON data from the photo's annotations.
 * Returns the first annotation with fabricJson data, or undefined if none exist.
 */
function getInitialAnnotations(photo: Photo): Record<string, unknown> | undefined {
	if (!photo.annotations || photo.annotations.length === 0) return undefined

	// Look for an annotation that has fabricJson (canvas-level serialization)
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
