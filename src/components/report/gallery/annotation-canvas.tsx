'use client'

import { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
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
	const containerSizeRef = useRef<{ w: number; h: number } | null>(null)

	const [ready, setReady] = useState(false)

	activeToolRef.current = activeTool
	activeColorRef.current = activeColor

	// Single effect: measure container, load image, create canvas
	useEffect(() => {
		const container = containerRef.current
		const canvasEl = canvasElRef.current
		if (!container || !canvasEl) return

		let disposed = false

		// Load image first, then create canvas with fresh container measurements
		const img = new window.Image()
		img.crossOrigin = 'anonymous'
		img.onload = () => {
			if (disposed) return

			// Measure container NOW (after image loaded, layout is fully settled)
			const cw = container!.offsetWidth
			const ch = container!.offsetHeight

			if (cw < 100 || ch < 100) return

			containerSizeRef.current = { w: cw, h: ch }

			const natW = img.naturalWidth
			const natH = img.naturalHeight

			// Calculate "contain" fit
			const scale = Math.min(cw / natW, ch / natH)
			const imgW = Math.round(natW * scale)
			const imgH = Math.round(natH * scale)
			const offsetX = Math.round((cw - imgW) / 2)
			const offsetY = Math.round((ch - imgH) / 2)

			// Create canvas at FULL container size
			const canvas = new fabric.Canvas(canvasEl!, {
				width: cw,
				height: ch,
				selection: false,
			})
			fabricCanvasRef.current = canvas

			// Fabric wraps the <canvas> in a div — make it fill the container
			const wrapper = canvasEl!.parentElement
			if (wrapper) {
				wrapper.style.position = 'absolute'
				wrapper.style.left = '0'
				wrapper.style.top = '0'
			}

			// Create FabricImage from the already-loaded img element
			const bgImg = new fabric.FabricImage(img, {
				scaleX: scale,
				scaleY: scale,
				left: offsetX,
				top: offsetY,
				selectable: false,
				evented: false,
			})

			canvas.backgroundImage = bgImg
			canvas.renderAll()

			// Restore saved annotations if any
			if (initialAnnotations) {
				const json = { ...initialAnnotations } as Record<string, unknown>
				delete json.width
				delete json.height
				delete json.backgroundImage
				delete json.background

				canvas.loadFromJSON(JSON.stringify(json)).then(() => {
					canvas.setDimensions({ width: cw, height: ch })
					canvas.backgroundImage = bgImg
					canvas.renderAll()
				})
			}

			onCanvasReady?.(canvas)
			setReady(true)
		}
		img.src = photoUrl

		// Handle resize
		const observer = new ResizeObserver(() => {
			const canvas = fabricCanvasRef.current
			if (!canvas || disposed) return

			const newW = container!.offsetWidth
			const newH = container!.offsetHeight
			if (newW < 100 || newH < 100) return

			const prev = containerSizeRef.current
			if (prev && Math.abs(prev.w - newW) < 2 && Math.abs(prev.h - newH) < 2) return
			containerSizeRef.current = { w: newW, h: newH }

			canvas.setDimensions({ width: newW, height: newH })

			// Re-center background image
			const bgImg = canvas.backgroundImage
			if (bgImg && bgImg instanceof fabric.FabricImage) {
				const natW = bgImg.width ?? 1
				const natH = bgImg.height ?? 1
				const scale = Math.min(newW / natW, newH / natH)
				bgImg.set({
					scaleX: scale,
					scaleY: scale,
					left: Math.round((newW - natW * scale) / 2),
					top: Math.round((newH - natH * scale) / 2),
				})
			}
			canvas.renderAll()
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
	}, [photoUrl])

	// Handle tool changes
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
					const line = new fabric.Line(
						[pointer.x, pointer.y, pointer.x, pointer.y],
						{
							stroke: color,
							strokeWidth: 3,
							selectable: false,
							evented: false,
						},
					)
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
					shape.set({
						x2: pointer.x,
						y2: pointer.y,
					})
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
			className={cn('absolute inset-0 overflow-hidden', className)}
		>
			<canvas ref={canvasElRef} />
		</div>
	)
}

function addArrowhead(
	canvas: fabric.Canvas,
	line: fabric.Line,
	color: string,
) {
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
		[
			new fabric.Point(x2, y2),
			new fabric.Point(p1x, p1y),
			new fabric.Point(p2x, p2y),
		],
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

export { AnnotationCanvas }
export type { AnnotationCanvasProps }
