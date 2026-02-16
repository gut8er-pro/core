'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
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

/**
 * Canvas is sized to the image's "contain" fit dimensions, then positioned
 * at the exact center of the container using absolute pixel coordinates.
 * This avoids relying on CSS flexbox which Fabric.js's wrapper div interferes with.
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
	const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
	const isDrawingShapeRef = useRef(false)
	const shapeStartRef = useRef<{ x: number; y: number } | null>(null)
	const activeShapeRef = useRef<fabric.FabricObject | null>(null)
	const activeToolRef = useRef<AnnotationTool>(activeTool)
	const activeColorRef = useRef<string>(activeColor)

	const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)

	activeToolRef.current = activeTool
	activeColorRef.current = activeColor

	// Step 1: Pre-load image to get natural dimensions
	useEffect(() => {
		setNaturalSize(null)
		const img = new Image()
		img.crossOrigin = 'anonymous'
		img.onload = () => {
			setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
		}
		img.src = photoUrl
	}, [photoUrl])

	// Position the Fabric.js wrapper element at the center of the container
	const positionCanvasWrapper = useCallback(
		(containerW: number, containerH: number, displayW: number, displayH: number) => {
			const canvasEl = canvasElRef.current
			if (!canvasEl) return

			// Fabric.js wraps the canvas in a div.canvas-container
			const wrapper = canvasEl.parentElement
			if (wrapper) {
				wrapper.style.position = 'absolute'
				wrapper.style.left = `${(containerW - displayW) / 2}px`
				wrapper.style.top = `${(containerH - displayH) / 2}px`
			}
		},
		[],
	)

	// Step 2: Create canvas once we have natural dimensions + container size
	useEffect(() => {
		const container = containerRef.current
		const canvasEl = canvasElRef.current
		if (!container || !canvasEl || !naturalSize) return

		let disposed = false
		let timerId: ReturnType<typeof setTimeout> | null = null

		function setup() {
			if (disposed) return

			const rect = container!.getBoundingClientRect()
			if (rect.width === 0 || rect.height === 0) {
				timerId = setTimeout(setup, 50)
				return
			}

			const scale = Math.min(rect.width / naturalSize!.w, rect.height / naturalSize!.h)
			const displayW = naturalSize!.w * scale
			const displayH = naturalSize!.h * scale

			const canvas = new fabric.Canvas(canvasEl!, {
				width: displayW,
				height: displayH,
				selection: false,
			})

			fabricCanvasRef.current = canvas

			// Position wrapper at center of container
			positionCanvasWrapper(rect.width, rect.height, displayW, displayH)

			// Load image as background filling the canvas from (0,0)
			fabric.FabricImage.fromURL(photoUrl, { crossOrigin: 'anonymous' }).then(
				(bgImg) => {
					if (disposed || !fabricCanvasRef.current) return
					const c = fabricCanvasRef.current

					bgImg.set({
						scaleX: displayW / (bgImg.width ?? 1),
						scaleY: displayH / (bgImg.height ?? 1),
						left: 0,
						top: 0,
						selectable: false,
						evented: false,
					})

					c.backgroundImage = bgImg
					c.renderAll()

					if (initialAnnotations) {
						c.loadFromJSON(JSON.stringify(initialAnnotations)).then(() => {
							c.backgroundImage = bgImg
							c.renderAll()
						})
					}
				},
			)

			onCanvasReady?.(canvas)
		}

		timerId = setTimeout(setup, 50)

		// Handle resize
		const observer = new ResizeObserver(() => {
			const canvas = fabricCanvasRef.current
			if (!canvas || !naturalSize) return

			const rect = container!.getBoundingClientRect()
			if (rect.width === 0 || rect.height === 0) return

			const scale = Math.min(rect.width / naturalSize.w, rect.height / naturalSize.h)
			const displayW = naturalSize.w * scale
			const displayH = naturalSize.h * scale

			canvas.setDimensions({ width: displayW, height: displayH })
			positionCanvasWrapper(rect.width, rect.height, displayW, displayH)

			const bgImg = canvas.backgroundImage
			if (bgImg && bgImg instanceof fabric.FabricImage) {
				bgImg.set({
					scaleX: displayW / (bgImg.width ?? 1),
					scaleY: displayH / (bgImg.height ?? 1),
					left: 0,
					top: 0,
				})
			}

			canvas.renderAll()
		})
		observer.observe(container)

		return () => {
			disposed = true
			if (timerId) clearTimeout(timerId)
			observer.disconnect()
			const canvas = fabricCanvasRef.current
			if (canvas) {
				canvas.dispose()
			}
			fabricCanvasRef.current = null
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [photoUrl, naturalSize])

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
	}, [activeTool, activeColor])

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
