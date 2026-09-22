import * as fabric from 'fabric'
import { describe, expect, it } from 'vitest'
import {
	boundsFrom,
	createShape,
	isDegenerate,
	makeEditable,
	makeInert,
	resizeShape,
	toArrowGroup,
} from './annotation-shapes'

describe('boundsFrom', () => {
	it('anchors the first point as a corner when dragging down-right', () => {
		expect(boundsFrom({ x: 10, y: 20 }, { x: 60, y: 90 })).toEqual({
			left: 10,
			top: 20,
			width: 50,
			height: 70,
		})
	})

	it('anchors the opposite corner when dragging up-left', () => {
		expect(boundsFrom({ x: 60, y: 90 }, { x: 10, y: 20 })).toEqual({
			left: 10,
			top: 20,
			width: 50,
			height: 70,
		})
	})
})

describe('createShape', () => {
	it('creates a rectangle anchored at the pointer, not centred on it', () => {
		const rect = createShape('rectangle', { x: 40, y: 50 }, '#FF0000')
		expect(rect.originX).toBe('left')
		expect(rect.originY).toBe('top')
		expect(rect.left).toBe(40)
		expect(rect.top).toBe(50)
	})

	it('creates an ellipse anchored at the pointer', () => {
		const ellipse = createShape('circle', { x: 5, y: 7 }, '#FF0000')
		expect(ellipse.originX).toBe('left')
		expect(ellipse.originY).toBe('top')
		expect(ellipse.left).toBe(5)
		expect(ellipse.top).toBe(7)
	})

	it('makes every new shape selectable and resizable', () => {
		for (const tool of ['rectangle', 'circle', 'arrow'] as const) {
			const shape = createShape(tool, { x: 0, y: 0 }, '#FF0000')
			expect(shape.selectable).toBe(true)
			expect(shape.evented).toBe(true)
			expect(shape.hasControls).toBe(true)
		}
	})
})

describe('resizeShape', () => {
	it('grows a rectangle out from the anchored corner', () => {
		const rect = createShape('rectangle', { x: 10, y: 10 }, '#FF0000')
		resizeShape(rect, { x: 10, y: 10 }, { x: 110, y: 60 })
		expect(rect.left).toBe(10)
		expect(rect.top).toBe(10)
		expect(rect.width).toBe(100)
		expect(rect.height).toBe(50)
	})

	it('flips the rectangle when dragged back past the anchor', () => {
		const rect = createShape('rectangle', { x: 100, y: 100 }, '#FF0000')
		resizeShape(rect, { x: 100, y: 100 }, { x: 40, y: 30 })
		expect(rect.left).toBe(40)
		expect(rect.top).toBe(30)
		expect(rect.width).toBe(60)
		expect(rect.height).toBe(70)
	})

	it('sizes an ellipse to half the dragged box', () => {
		const ellipse = createShape('circle', { x: 0, y: 0 }, '#FF0000') as fabric.Ellipse
		resizeShape(ellipse, { x: 0, y: 0 }, { x: 80, y: 40 })
		expect(ellipse.rx).toBe(40)
		expect(ellipse.ry).toBe(20)
		expect(ellipse.left).toBe(0)
		expect(ellipse.top).toBe(0)
	})

	it('extends an arrow to the pointer', () => {
		const line = createShape('arrow', { x: 0, y: 0 }, '#FF0000') as fabric.Line
		resizeShape(line, { x: 0, y: 0 }, { x: 30, y: 40 })
		expect(line.x2).toBe(30)
		expect(line.y2).toBe(40)
	})
})

describe('isDegenerate', () => {
	it('flags a stray click', () => {
		const rect = createShape('rectangle', { x: 10, y: 10 }, '#FF0000')
		expect(isDegenerate(rect, { x: 10, y: 10 }, { x: 11, y: 11 })).toBe(true)
	})

	it('accepts a real drag', () => {
		const rect = createShape('rectangle', { x: 10, y: 10 }, '#FF0000')
		expect(isDegenerate(rect, { x: 10, y: 10 }, { x: 90, y: 70 })).toBe(false)
	})

	it('measures an arrow by its length', () => {
		const line = createShape('arrow', { x: 0, y: 0 }, '#FF0000')
		expect(isDegenerate(line, { x: 0, y: 0 }, { x: 2, y: 2 })).toBe(true)
		expect(isDegenerate(line, { x: 0, y: 0 }, { x: 50, y: 0 })).toBe(false)
	})
})

describe('toArrowGroup', () => {
	it('bundles the line and its head into one selectable marking', () => {
		const line = createShape('arrow', { x: 0, y: 0 }, '#FF0000') as fabric.Line
		resizeShape(line, { x: 0, y: 0 }, { x: 100, y: 0 })
		const group = toArrowGroup(line, '#FF0000')
		expect(group).toBeInstanceOf(fabric.Group)
		expect(group.getObjects()).toHaveLength(2)
		expect(group.selectable).toBe(true)
	})
})

describe('makeEditable / makeInert', () => {
	it('toggles interactivity', () => {
		const rect = createShape('rectangle', { x: 0, y: 0 }, '#FF0000')
		makeInert(rect)
		expect(rect.selectable).toBe(false)
		expect(rect.evented).toBe(false)

		makeEditable(rect)
		expect(rect.selectable).toBe(true)
		expect(rect.evented).toBe(true)
		expect(rect.hasControls).toBe(true)
	})
})
