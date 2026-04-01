'use client'

import * as fabric from 'fabric'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { AnnotationTool } from './annotation-toolbar'

type AnnotationCanvasProps = {
	photoUrl: string
	activeTool: AnnotationTool
	activeColor: string
	initialAnnotations?: Record<string, unknown>
	onCanvasReady?: (canvas: fabric.Canvas) => void
	className?: string
}

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
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
	const isDrawingShapeRef = useRef(false)
	const shapeStartRef = useRef<{ x: number; y: number } | null>(null)
	const activeShapeRef = useRef<fabric.FabricObject | null>(null)
	const activeToolRef = useRef<AnnotationTool>(activeTool)
	const activeColorRef = useRef<string>(activeColor)
	// Store the natural image dimensions for export
	const naturalSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })

	const [_ready, setReady] = useState(false)

	activeToolRef.current = activeTool
	activeColorRef.current = activeColor

	// Core effect: load image, create canvas sized to fit image
	useEffect(() => {
		const container = containerRef.current
		const canvasEl = canvasElRef.current
		if (!container || !canvasEl) return

		let disposed = false

		const img = new window.Image()
		img.crossOrigin = 'anonymous'
		img.onload = () => {
			if (disposed) return

			const cw = container.offsetWidth
			const ch = container.offsetHeight
			if (cw < 50 || ch < 50) return

			const natW = img.naturalWidth
			const natH = img.naturalHeight
			naturalSizeRef.current = { w: natW, h: natH }

			// "Contain" fit — canvas size = displayed image size
			const scale = Math.min(cw / natW, ch / natH)
			const canvasW = Math.round(natW * scale)
			const canvasH = Math.round(natH * scale)

			const canvas = new fabric.Canvas(canvasEl, {
				width: canvasW,
				height: canvasH,
				selection: false,
			})
			fabricCanvasRef.current = canvas

			// Center the canvas wrapper inside the container
			const wrapper = canvasEl.parentElement
			if (wrapper) {
				wrapper.style.position = 'absolute'
				wrapper.style.left = `${Math.round((cw - canvasW) / 2)}px`
				wrapper.style.top = `${Math.round((ch - canvasH) / 2)}px`
			}

			// Background image fills the entire canvas (no offset)
			const bgImg = new fabric.FabricImage(img, {
				scaleX: scale,
				scaleY: scale,
				left: 0,
				top: 0,
				selectable: false,
				evented: false,
			})
			canvas.backgroundImage = bgImg
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
					canvas.backgroundImage = bgImg
					canvas.renderAll()
				})
			}

			onCanvasReady?.(canvas)
			setReady(true)
		}
		img.src = photoUrl

		// Handle container resize
		const observer = new ResizeObserver(() => {
			const c = fabricCanvasRef.current
			if (!c || disposed) return

			const newCW = container.offsetWidth
			const newCH = container.offsetHeight
			if (newCW < 50 || newCH < 50) return

			const { w: natW, h: natH } = naturalSizeRef.current
			if (!natW || !natH) return

			const newScale = Math.min(newCW / natW, newCH / natH)
			const newW = Math.round(natW * newScale)
			const newH = Math.round(natH * newScale)

			c.setDimensions({ width: newW, height: newH })

			// Re-center wrapper
			const wrapper = canvasEl.parentElement
			if (wrapper) {
				wrapper.style.left = `${Math.round((newCW - newW) / 2)}px`
				wrapper.style.top = `${Math.round((newCH - newH) / 2)}px`
			}

			// Update background image scale
			const bgImg = c.backgroundImage
			if (bgImg && bgImg instanceof fabric.FabricImage) {
				bgImg.set({ scaleX: newScale, scaleY: newScale, left: 0, top: 0 })
			}

			c.renderAll()
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
	}, [photoUrl, initialAnnotations, onCanvasReady])

	// Tool handling
	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas) return

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
	}, [activeTool, activeColor])

	// Sync drawing brush color
	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas) return
		if (canvas.isDrawingMode && canvas.freeDrawingBrush) {
			canvas.freeDrawingBrush.color = activeColor
		}
	}, [activeColor])

	return (
		<div ref={containerRef} className={cn('relative h-full w-full overflow-hidden', className)}>
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
