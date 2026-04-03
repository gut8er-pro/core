'use client'

import * as fabric from 'fabric'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { AnnotationTool } from './annotation-toolbar'

type AnnotationCanvasProps = {
	photoUrl: string
	activeTool: AnnotationTool
	activeColor: string
	initialAnnotations?: Record<string, unknown>
	onCanvasReady?: (canvas: fabric.Canvas, exportFn: () => string | null) => void
	className?: string
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
	onCanvasReady,
	className,
}: AnnotationCanvasProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const canvasElRef = useRef<HTMLCanvasElement>(null)
	const imgElRef = useRef<HTMLImageElement>(null)
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
	const isDrawingShapeRef = useRef(false)
	const shapeStartRef = useRef<{ x: number; y: number } | null>(null)
	const activeShapeRef = useRef<fabric.FabricObject | null>(null)
	const activeToolRef = useRef<AnnotationTool>(activeTool)
	const activeColorRef = useRef<string>(activeColor)

	const [ready, setReady] = useState(false)
	const [imgLoaded, setImgLoaded] = useState(false)

	activeToolRef.current = activeTool
	activeColorRef.current = activeColor

	// Reset imgLoaded when photo changes
	useEffect(() => {
		setImgLoaded(false)
	}, [])

	const handleImgLoad = useCallback(() => {
		setImgLoaded(true)
	}, [])

	// Export: composite image + annotations at full resolution
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

		// Draw original image at full resolution
		ctx.drawImage(img, 0, 0, natW, natH)

		// Draw annotations scaled up to match full resolution
		const objects = canvas.getObjects()
		if (objects.length > 0 && canvas.width) {
			const multiplier = natW / canvas.width
			const annotationCanvas = canvas.toCanvasElement(multiplier)
			ctx.drawImage(annotationCanvas, 0, 0)
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
				})
				fabricCanvasRef.current = canvas

				// Position Fabric wrapper exactly over the image
				const wrapper = canvasEl.parentElement
				if (wrapper) {
					wrapper.style.position = 'absolute'
					wrapper.style.left = `${offsetX}px`
					wrapper.style.top = `${offsetY}px`
					wrapper.style.width = `${canvasW}px`
					wrapper.style.height = `${canvasH}px`
					wrapper.style.zIndex = '2'
				}

				canvas.renderAll()

				// Restore saved annotations
				if (initialAnnotations) {
					const json = { ...initialAnnotations } as Record<string, unknown>
					delete json.width
					delete json.height
					delete json.backgroundImage
					delete json.background

					canvas.loadFromJSON(JSON.stringify(json)).then(() => {
						canvas.setDimensions({ width: canvasW, height: canvasH })
						canvas.renderAll()
					})
				}

				onCanvasReady?.(canvas, getExportDataUrl)
				setReady(true)
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [imgLoaded, getExportDataUrl, initialAnnotations, onCanvasReady])

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

		if (activeTool === 'pen') {
			canvas.isDrawingMode = true
			canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
			canvas.freeDrawingBrush.color = activeColor
			canvas.freeDrawingBrush.width = 3
			canvas.forEachObject((obj) => {
				obj.selectable = false
				obj.evented = false
			})
		} else if (activeTool === 'crop') {
			canvas.selection = true
			canvas.defaultCursor = 'crosshair'
			canvas.forEachObject((obj) => {
				obj.selectable = false
				obj.evented = false
			})
		} else {
			canvas.defaultCursor = 'crosshair'
			canvas.forEachObject((obj) => {
				obj.selectable = false
				obj.evented = false
			})

			canvas.on('mouse:down', (opt) => {
				if (isDrawingShapeRef.current) return
				const pointer = canvas.getViewportPoint(opt.e)
				isDrawingShapeRef.current = true
				shapeStartRef.current = { x: pointer.x, y: pointer.y }

				const tool = activeToolRef.current
				const color = activeColorRef.current

				if (tool === 'circle') {
					const ellipse = new fabric.Ellipse({
						left: pointer.x,
						top: pointer.y,
						rx: 0,
						ry: 0,
						fill: 'transparent',
						stroke: color,
						strokeWidth: 3,
						selectable: false,
						evented: false,
					})
					canvas.add(ellipse)
					activeShapeRef.current = ellipse
				} else if (tool === 'rectangle') {
					const rect = new fabric.Rect({
						left: pointer.x,
						top: pointer.y,
						width: 0,
						height: 0,
						fill: 'transparent',
						stroke: color,
						strokeWidth: 3,
						selectable: false,
						evented: false,
					})
					canvas.add(rect)
					activeShapeRef.current = rect
				} else if (tool === 'arrow') {
					const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
						stroke: color,
						strokeWidth: 3,
						selectable: false,
						evented: false,
					})
					canvas.add(line)
					activeShapeRef.current = line
				}
			})

			canvas.on('mouse:move', (opt) => {
				if (!isDrawingShapeRef.current || !shapeStartRef.current) return
				const pointer = canvas.getViewportPoint(opt.e)
				const startX = shapeStartRef.current.x
				const startY = shapeStartRef.current.y
				const shape = activeShapeRef.current
				const tool = activeToolRef.current

				if (!shape) return

				if (tool === 'circle' && shape instanceof fabric.Ellipse) {
					const rx = Math.abs(pointer.x - startX) / 2
					const ry = Math.abs(pointer.y - startY) / 2
					shape.set({
						rx,
						ry,
						left: Math.min(startX, pointer.x),
						top: Math.min(startY, pointer.y),
					})
				} else if (tool === 'rectangle' && shape instanceof fabric.Rect) {
					shape.set({
						left: Math.min(startX, pointer.x),
						top: Math.min(startY, pointer.y),
						width: Math.abs(pointer.x - startX),
						height: Math.abs(pointer.y - startY),
					})
				} else if (tool === 'arrow' && shape instanceof fabric.Line) {
					shape.set({ x2: pointer.x, y2: pointer.y })
				}

				canvas.renderAll()
			})

			canvas.on('mouse:up', () => {
				if (!isDrawingShapeRef.current) return

				const shape = activeShapeRef.current
				const tool = activeToolRef.current

				if (tool === 'arrow' && shape instanceof fabric.Line) {
					addArrowhead(canvas, shape, activeColorRef.current)
				}

				if (shape) {
					shape.set({ selectable: false, evented: false })
					canvas.renderAll()
				}

				isDrawingShapeRef.current = false
				shapeStartRef.current = null
				activeShapeRef.current = null
			})
		}

		return () => {
			canvas.off('mouse:down')
			canvas.off('mouse:move')
			canvas.off('mouse:up')
		}
	}, [activeTool, activeColor, ready])

	// Sync drawing brush color
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
			{/* Image layer: CSS object-contain handles display reliably */}
			<img
				ref={imgElRef}
				src={photoUrl}
				alt=""
				className="absolute inset-0 h-full w-full rounded-xl object-contain"
				crossOrigin="anonymous"
				onLoad={handleImgLoad}
			/>
			{/* Transparent Fabric.js canvas overlaid on image for annotations */}
			<canvas ref={canvasElRef} />
		</div>
	)
}

function addArrowhead(canvas: fabric.Canvas, line: fabric.Line, color: string) {
	const x1 = line.x1 ?? 0
	const y1 = line.y1 ?? 0
	const x2 = line.x2 ?? 0
	const y2 = line.y2 ?? 0

	const angle = Math.atan2(y2 - y1, x2 - x1)
	const headLength = 15

	const p1x = x2 - headLength * Math.cos(angle - Math.PI / 6)
	const p1y = y2 - headLength * Math.sin(angle - Math.PI / 6)
	const p2x = x2 - headLength * Math.cos(angle + Math.PI / 6)
	const p2y = y2 - headLength * Math.sin(angle + Math.PI / 6)

	const arrowHead = new fabric.Polygon(
		[new fabric.Point(x2, y2), new fabric.Point(p1x, p1y), new fabric.Point(p2x, p2y)],
		{
			fill: color,
			stroke: color,
			strokeWidth: 1,
			selectable: false,
			evented: false,
		},
	)

	canvas.add(arrowHead)
	canvas.renderAll()
}

export type { AnnotationCanvasProps }
export { AnnotationCanvas }
