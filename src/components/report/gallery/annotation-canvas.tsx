'use client'

import * as fabric from 'fabric'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
	createShape,
	isDegenerate,
	makeEditable,
	makeInert,
	type Point,
	resizeShape,
	type ShapeTool,
	toArrowGroup,
} from './annotation-shapes'
import type { AnnotationTool } from './annotation-toolbar'

type SelectionBox = { left: number; top: number; width: number; height: number }

type AnnotationCanvasProps = {
	photoUrl: string
	activeTool: AnnotationTool
	activeColor: string
	initialAnnotations?: Record<string, unknown>
	readOnly?: boolean
	onCanvasReady?: (canvas: fabric.Canvas, exportFn: () => string | null) => void
	onSelectionChange?: (box: SelectionBox | null) => void
	className?: string
}

const SHAPE_TOOLS: ReadonlySet<AnnotationTool> = new Set<AnnotationTool>([
	'circle',
	'rectangle',
	'arrow',
])

function isShapeTool(tool: AnnotationTool): tool is ShapeTool {
	return SHAPE_TOOLS.has(tool)
}

/**
 * Hybrid annotation canvas:
 * - An <img> element handles image display via CSS object-contain (always works)
 * - A transparent Fabric.js canvas is overlaid for annotations
 * - Export composites the image + annotations at full resolution
 */
function AnnotationCanvas({
	photoUrl,
	activeTool,
	activeColor,
	initialAnnotations,
	readOnly = false,
	onCanvasReady,
	onSelectionChange,
	className,
}: AnnotationCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const canvasElRef = useRef<HTMLCanvasElement>(null)
	const imgElRef = useRef<HTMLImageElement>(null)
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
	const isDrawingShapeRef = useRef(false)
	const shapeStartRef = useRef<Point | null>(null)
	const activeShapeRef = useRef<fabric.FabricObject | null>(null)
	const activeToolRef = useRef<AnnotationTool>(activeTool)
	const activeColorRef = useRef<string>(activeColor)
	const initialAnnotationsRef = useRef(initialAnnotations)
	const onCanvasReadyRef = useRef(onCanvasReady)
	const onSelectionChangeRef = useRef(onSelectionChange)

	const [ready, setReady] = useState(false)
	const [imgLoaded, setImgLoaded] = useState(false)

	activeToolRef.current = activeTool
	activeColorRef.current = activeColor
	initialAnnotationsRef.current = initialAnnotations
	onCanvasReadyRef.current = onCanvasReady
	onSelectionChangeRef.current = onSelectionChange

	const handleImgLoad = useCallback(() => {
		setImgLoaded(true)
	}, [])

	// A cached image can finish loading before this effect runs, so `onLoad` never
	// fires and the canvas would wait forever.
	useEffect(() => {
		const img = imgElRef.current
		if (img?.complete && img.naturalWidth > 0) {
			setImgLoaded(true)
		}
	}, [])

	const getExportDataUrl = useCallback((): string | null => {
		const img = imgElRef.current
		const canvas = fabricCanvasRef.current
		if (!img || !canvas) return null

		const natW = img.naturalWidth
		const natH = img.naturalHeight
		if (!natW || !natH) return null

		const tempCanvas = document.createElement('canvas')
		tempCanvas.width = natW
		tempCanvas.height = natH
		const ctx = tempCanvas.getContext('2d')
		if (!ctx) return null

		ctx.drawImage(img, 0, 0, natW, natH)

		const objects = canvas.getObjects()
		const cssWidth = canvas.getWidth()
		if (objects.length > 0 && cssWidth) {
			canvas.discardActiveObject()
			canvas.renderAll()
			const annotationCanvas = canvas.toCanvasElement(natW / cssWidth)
			ctx.drawImage(annotationCanvas, 0, 0, natW, natH)
		}

		return tempCanvas.toDataURL('image/jpeg', 0.9)
	}, [])

	// Initialize/resize Fabric canvas overlay to match image position
	useEffect(() => {
		if (!imgLoaded) return

		const container = containerRef.current
		const canvasEl = canvasElRef.current
		const img = imgElRef.current
		if (!container || !canvasEl || !img) return

		const natW = img.naturalWidth
		const natH = img.naturalHeight
		if (!natW || !natH) return

		let disposed = false
		let initialized = false

		function announceSelection(canvas: fabric.Canvas) {
			const notify = onSelectionChangeRef.current
			if (!notify) return
			const active = canvas.getActiveObject()
			if (!active) {
				notify(null)
				return
			}
			const rect = active.getBoundingRect()
			const wrapper = canvasEl?.parentElement
			const offsetX = wrapper ? Number.parseFloat(wrapper.style.left || '0') : 0
			const offsetY = wrapper ? Number.parseFloat(wrapper.style.top || '0') : 0
			notify({
				left: rect.left + offsetX,
				top: rect.top + offsetY,
				width: rect.width,
				height: rect.height,
			})
		}

		function layout() {
			if (disposed || !container || !canvasEl) return

			const cw = container.clientWidth
			const ch = container.clientHeight
			if (cw < 50 || ch < 50) return

			// Contain-fit: same math as CSS object-contain
			const scale = Math.min(cw / natW, ch / natH)
			const canvasW = Math.round(natW * scale)
			const canvasH = Math.round(natH * scale)
			const offsetX = Math.round((cw - canvasW) / 2)
			const offsetY = Math.round((ch - canvasH) / 2)

			if (!initialized) {
				initialized = true

				if (fabricCanvasRef.current) {
					fabricCanvasRef.current.dispose()
					fabricCanvasRef.current = null
				}

				const canvas = new fabric.Canvas(canvasEl, {
					width: canvasW,
					height: canvasH,
					selection: false,
					preserveObjectStacking: true,
				})
				fabricCanvasRef.current = canvas

				const wrapper = canvasEl.parentElement
				if (wrapper) {
					wrapper.style.position = 'absolute'
					wrapper.style.left = `${offsetX}px`
					wrapper.style.top = `${offsetY}px`
					wrapper.style.width = `${canvasW}px`
					wrapper.style.height = `${canvasH}px`
					wrapper.style.zIndex = '2'
				}

				canvas.on('selection:created', () => announceSelection(canvas))
				canvas.on('selection:updated', () => announceSelection(canvas))
				canvas.on('selection:cleared', () => onSelectionChangeRef.current?.(null))
				canvas.on('object:moving', () => announceSelection(canvas))
				canvas.on('object:scaling', () => announceSelection(canvas))
				canvas.on('object:modified', () => announceSelection(canvas))

				canvas.renderAll()

				// The canvas is only handed over once the stored markings are back on
				// it — a Save in that window would otherwise serialise an empty canvas
				// and wipe them.
				const stored = initialAnnotationsRef.current
				if (stored) {
					const json = { ...stored } as Record<string, unknown>
					delete json.width
					delete json.height
					delete json.backgroundImage
					delete json.background

					canvas
						.loadFromJSON(JSON.stringify(json))
						.then(() => {
							if (disposed) return
							canvas.setDimensions({ width: canvasW, height: canvasH })
							canvas.renderAll()
							onCanvasReadyRef.current?.(canvas, getExportDataUrl)
							setReady(true)
						})
						.catch(() => {
							if (disposed) return
							onCanvasReadyRef.current?.(canvas, getExportDataUrl)
							setReady(true)
						})
				} else {
					onCanvasReadyRef.current?.(canvas, getExportDataUrl)
					setReady(true)
				}
			} else {
				const c = fabricCanvasRef.current
				if (!c) return

				c.setDimensions({ width: canvasW, height: canvasH })

				const wrapper = canvasEl.parentElement
				if (wrapper) {
					wrapper.style.left = `${offsetX}px`
					wrapper.style.top = `${offsetY}px`
					wrapper.style.width = `${canvasW}px`
					wrapper.style.height = `${canvasH}px`
				}

				c.renderAll()
				announceSelection(c)
			}
		}

		const observer = new ResizeObserver(() => {
			if (!disposed) layout()
		})
		observer.observe(container)

		return () => {
			disposed = true
			observer.disconnect()
			if (fabricCanvasRef.current) {
				fabricCanvasRef.current.dispose()
				fabricCanvasRef.current = null
			}
			setReady(false)
		}
	}, [imgLoaded, getExportDataUrl])

	// Tool handling
	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas || !ready) return

		canvas.isDrawingMode = false
		canvas.selection = false
		canvas.defaultCursor = 'default'

		canvas.off('mouse:down')
		canvas.off('mouse:move')
		canvas.off('mouse:up')

		if (readOnly) {
			canvas.discardActiveObject()
			canvas.forEachObject(makeInert)
			canvas.renderAll()
			return
		}

		if (activeTool === 'pen') {
			canvas.discardActiveObject()
			canvas.isDrawingMode = true
			canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
			canvas.freeDrawingBrush.color = activeColor
			canvas.freeDrawingBrush.width = 3
			canvas.forEachObject(makeInert)
			canvas.renderAll()

			canvas.on('path:created', (opt) => {
				const path = (opt as unknown as { path?: fabric.FabricObject }).path
				if (path) makeEditable(path)
			})
		} else if (activeTool === 'select') {
			canvas.selection = true
			canvas.forEachObject(makeEditable)
			canvas.renderAll()
		} else if (activeTool === 'crop') {
			canvas.discardActiveObject()
			canvas.defaultCursor = 'crosshair'
			canvas.forEachObject(makeInert)
			canvas.renderAll()
		} else if (isShapeTool(activeTool)) {
			canvas.discardActiveObject()
			canvas.defaultCursor = 'crosshair'
			canvas.forEachObject(makeInert)
			canvas.renderAll()

			canvas.on('mouse:down', (opt) => {
				if (isDrawingShapeRef.current) return
				const tool = activeToolRef.current
				if (!isShapeTool(tool)) return

				const pointer = canvas.getScenePoint(opt.e)
				isDrawingShapeRef.current = true
				shapeStartRef.current = { x: pointer.x, y: pointer.y }

				const shape = createShape(tool, shapeStartRef.current, activeColorRef.current)
				makeInert(shape)
				canvas.add(shape)
				activeShapeRef.current = shape
			})

			canvas.on('mouse:move', (opt) => {
				const start = shapeStartRef.current
				const shape = activeShapeRef.current
				if (!isDrawingShapeRef.current || !start || !shape) return

				const pointer = canvas.getScenePoint(opt.e)
				resizeShape(shape, start, { x: pointer.x, y: pointer.y })
				canvas.renderAll()
			})

			canvas.on('mouse:up', (opt) => {
				if (!isDrawingShapeRef.current) return

				const shape = activeShapeRef.current
				const start = shapeStartRef.current
				const pointer = canvas.getScenePoint(opt.e)
				const end = { x: pointer.x, y: pointer.y }

				isDrawingShapeRef.current = false
				shapeStartRef.current = null
				activeShapeRef.current = null

				if (!shape || !start) return

				// A stray click leaves a zero-size ghost that can never be grabbed again.
				if (isDegenerate(shape, start, end)) {
					canvas.remove(shape)
					canvas.renderAll()
					return
				}

				if (shape instanceof fabric.Line) {
					canvas.remove(shape)
					const arrow = toArrowGroup(shape, activeColorRef.current)
					makeInert(arrow)
					canvas.add(arrow)
				} else {
					makeInert(shape)
				}

				canvas.renderAll()
			})
		}

		return () => {
			canvas.off('mouse:down')
			canvas.off('mouse:move')
			canvas.off('mouse:up')
			canvas.off('path:created')
		}
	}, [activeTool, activeColor, ready, readOnly])

	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas) return
		if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
			canvas.freeDrawingBrush.color = activeColor
		}
	}, [activeColor])

	return (
		<div
			ref={containerRef}
			className={cn('absolute inset-0 overflow-hidden rounded-xl', className)}
		>
			<img
				ref={imgElRef}
				src={photoUrl}
				alt=""
				className="absolute inset-0 h-full w-full rounded-xl object-contain"
				crossOrigin="anonymous"
				onLoad={handleImgLoad}
			/>
			<canvas ref={canvasElRef} />
		</div>
	)
}

export type { AnnotationCanvasProps, SelectionBox }
export { AnnotationCanvas }
