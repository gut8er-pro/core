'use client'

import { useEffect, useRef, useCallback } from 'react'
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

	// Keep refs in sync
	activeToolRef.current = activeTool
	activeColorRef.current = activeColor

	const fitCanvasToContainer = useCallback(() => {
		const canvas = fabricCanvasRef.current
		const container = containerRef.current
		if (!canvas || !container) return

		const { width, height } = container.getBoundingClientRect()
		if (width === 0 || height === 0) return

		canvas.setDimensions({ width, height })

		// Re-fit the background image if it exists
		const bgImage = canvas.backgroundImage
		if (bgImage && bgImage instanceof fabric.FabricImage) {
			scaleBackgroundToFit(canvas, bgImage, width, height)
		}
	}, [])

	const scaleBackgroundToFit = useCallback(
		(
			canvas: fabric.Canvas,
			img: fabric.FabricImage,
			containerWidth: number,
			containerHeight: number,
		) => {
			const imgWidth = img.width ?? 1
			const imgHeight = img.height ?? 1
			const scale = Math.min(
				containerWidth / imgWidth,
				containerHeight / imgHeight,
			)

			img.set({
				scaleX: scale,
				scaleY: scale,
				left: (containerWidth - imgWidth * scale) / 2,
				top: (containerHeight - imgHeight * scale) / 2,
				selectable: false,
				evented: false,
			})

			canvas.renderAll()
		},
		[],
	)

	// Initialize canvas
	useEffect(() => {
		const canvasEl = canvasElRef.current
		const container = containerRef.current
		if (!canvasEl || !container) return

		const { width, height } = container.getBoundingClientRect()

		const canvas = new fabric.Canvas(canvasEl, {
			width: width || 800,
			height: height || 600,
			selection: true,
		})

		fabricCanvasRef.current = canvas

		// Load background image
		fabric.FabricImage.fromURL(photoUrl, { crossOrigin: 'anonymous' }).then(
			(img) => {
				if (!fabricCanvasRef.current) return
				const c = fabricCanvasRef.current
				const cWidth = c.getWidth()
				const cHeight = c.getHeight()

				scaleBackgroundToFit(c, img, cWidth, cHeight)
				c.backgroundImage = img
				c.renderAll()

				// Load initial annotations if provided
				if (initialAnnotations) {
					canvas
						.loadFromJSON(JSON.stringify(initialAnnotations))
						.then(() => {
							// Restore the background image after loading JSON
							// because loadFromJSON can override it
							c.backgroundImage = img
							c.renderAll()
						})
				}
			},
		)

		onCanvasReady?.(canvas)

		// ResizeObserver for responsive canvas
		const observer = new ResizeObserver(() => {
			fitCanvasToContainer()
		})
		observer.observe(container)

		return () => {
			observer.disconnect()
			canvas.dispose()
			fabricCanvasRef.current = null
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [photoUrl])

	// Handle tool changes
	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas) return

		// Reset drawing mode
		canvas.isDrawingMode = false
		canvas.selection = false
		canvas.defaultCursor = 'default'

		// Remove shape-drawing listeners
		canvas.off('mouse:down')
		canvas.off('mouse:move')
		canvas.off('mouse:up')

		if (activeTool === 'select') {
			canvas.selection = true
			canvas.defaultCursor = 'default'
			canvas.forEachObject((obj) => {
				obj.selectable = true
				obj.evented = true
			})
		} else if (activeTool === 'pen') {
			canvas.isDrawingMode = true
			canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
			canvas.freeDrawingBrush.color = activeColor
			canvas.freeDrawingBrush.width = 3
			canvas.forEachObject((obj) => {
				obj.selectable = false
				obj.evented = false
			})
		} else {
			// Shape tools: circle, rectangle, arrow
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

				// Add arrowhead for arrow tool
				if (tool === 'arrow' && shape instanceof fabric.Line) {
					addArrowhead(canvas, shape, activeColorRef.current)
				}

				// Make the drawn shape selectable in select mode later
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

	// Update brush color when activeColor changes (for pen tool)
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
			className={cn('relative h-full w-full overflow-hidden bg-grey-25', className)}
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
