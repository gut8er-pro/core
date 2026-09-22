import * as fabric from 'fabric'

type Point = { x: number; y: number }

type ShapeTool = 'circle' | 'rectangle' | 'arrow'

const STROKE_WIDTH = 3
const ARROWHEAD_LENGTH = 15

const EDITABLE_PROPS = {
	selectable: true,
	evented: true,
	hasControls: true,
	hasBorders: true,
	objectCaching: false,
} as const

/**
 * Fabric v7 defaults every object to origin "center"; drawing tools need the
 * first click pinned as a corner, so both axes are forced to top/left here.
 */
const CORNER_ORIGIN = {
	originX: 'left',
	originY: 'top',
} as const

function boundsFrom(start: Point, current: Point) {
	return {
		left: Math.min(start.x, current.x),
		top: Math.min(start.y, current.y),
		width: Math.abs(current.x - start.x),
		height: Math.abs(current.y - start.y),
	}
}

function createShape(tool: ShapeTool, start: Point, color: string): fabric.FabricObject {
	if (tool === 'circle') {
		return new fabric.Ellipse({
			...CORNER_ORIGIN,
			...EDITABLE_PROPS,
			left: start.x,
			top: start.y,
			rx: 0,
			ry: 0,
			fill: 'transparent',
			stroke: color,
			strokeWidth: STROKE_WIDTH,
		})
	}

	if (tool === 'rectangle') {
		return new fabric.Rect({
			...CORNER_ORIGIN,
			...EDITABLE_PROPS,
			left: start.x,
			top: start.y,
			width: 0,
			height: 0,
			fill: 'transparent',
			stroke: color,
			strokeWidth: STROKE_WIDTH,
		})
	}

	return new fabric.Line([start.x, start.y, start.x, start.y], {
		...CORNER_ORIGIN,
		...EDITABLE_PROPS,
		stroke: color,
		strokeWidth: STROKE_WIDTH,
	})
}

function resizeShape(shape: fabric.FabricObject, start: Point, current: Point): void {
	if (shape instanceof fabric.Ellipse) {
		const bounds = boundsFrom(start, current)
		shape.set({
			left: bounds.left,
			top: bounds.top,
			rx: bounds.width / 2,
			ry: bounds.height / 2,
		})
		shape.setCoords()
		return
	}

	if (shape instanceof fabric.Rect) {
		const bounds = boundsFrom(start, current)
		shape.set(bounds)
		shape.setCoords()
		return
	}

	if (shape instanceof fabric.Line) {
		shape.set({ x2: current.x, y2: current.y })
		shape.setCoords()
	}
}

/**
 * An arrow is a line plus its head; grouping them keeps the pair one selectable,
 * movable, deletable marking rather than two strays.
 */
function toArrowGroup(line: fabric.Line, color: string): fabric.Group {
	const x1 = line.x1 ?? 0
	const y1 = line.y1 ?? 0
	const x2 = line.x2 ?? 0
	const y2 = line.y2 ?? 0

	const angle = Math.atan2(y2 - y1, x2 - x1)
	const p1x = x2 - ARROWHEAD_LENGTH * Math.cos(angle - Math.PI / 6)
	const p1y = y2 - ARROWHEAD_LENGTH * Math.sin(angle - Math.PI / 6)
	const p2x = x2 - ARROWHEAD_LENGTH * Math.cos(angle + Math.PI / 6)
	const p2y = y2 - ARROWHEAD_LENGTH * Math.sin(angle + Math.PI / 6)

	const head = new fabric.Polygon(
		[new fabric.Point(x2, y2), new fabric.Point(p1x, p1y), new fabric.Point(p2x, p2y)],
		{
			fill: color,
			stroke: color,
			strokeWidth: 1,
		},
	)

	return new fabric.Group([line, head], EDITABLE_PROPS)
}

function isDegenerate(shape: fabric.FabricObject, start: Point, end: Point): boolean {
	if (shape instanceof fabric.Line) {
		return Math.hypot(end.x - start.x, end.y - start.y) < 4
	}
	const bounds = boundsFrom(start, end)
	return bounds.width < 4 || bounds.height < 4
}

function makeEditable(object: fabric.FabricObject): void {
	object.set(EDITABLE_PROPS)
	object.setCoords()
}

function makeInert(object: fabric.FabricObject): void {
	object.set({ selectable: false, evented: false })
}

export type { Point, ShapeTool }
export {
	ARROWHEAD_LENGTH,
	boundsFrom,
	CORNER_ORIGIN,
	createShape,
	EDITABLE_PROPS,
	isDegenerate,
	makeEditable,
	makeInert,
	resizeShape,
	STROKE_WIDTH,
	toArrowGroup,
}
