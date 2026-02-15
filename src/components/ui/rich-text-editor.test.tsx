import { render, screen } from '@/test/test-utils'
import { describe, expect, it } from 'vitest'
import { RichTextEditor } from './rich-text-editor'

describe('RichTextEditor', () => {
	it('renders toolbar', () => {
		render(<RichTextEditor />)
		expect(screen.getByRole('toolbar', { name: 'Formatting options' })).toBeInTheDocument()
	})

	it('renders all toolbar buttons', () => {
		render(<RichTextEditor />)
		expect(screen.getByLabelText('Bold')).toBeInTheDocument()
		expect(screen.getByLabelText('Italic')).toBeInTheDocument()
		expect(screen.getByLabelText('Ordered list')).toBeInTheDocument()
		expect(screen.getByLabelText('Unordered list')).toBeInTheDocument()
		expect(screen.getByLabelText('Align left')).toBeInTheDocument()
		expect(screen.getByLabelText('Align center')).toBeInTheDocument()
		expect(screen.getByLabelText('Align right')).toBeInTheDocument()
		expect(screen.getByLabelText('Justify')).toBeInTheDocument()
		expect(screen.getByLabelText('Bookmark')).toBeInTheDocument()
		expect(screen.getByLabelText('Font')).toBeInTheDocument()
	})

	it('renders editable area', () => {
		render(<RichTextEditor />)
		expect(screen.getByRole('textbox', { name: 'Email body' })).toBeInTheDocument()
	})

	it('renders with initial content', () => {
		render(<RichTextEditor value="<p>Hello world</p>" />)
		const editor = screen.getByRole('textbox', { name: 'Email body' })
		expect(editor.innerHTML).toContain('Hello world')
	})

	it('is multiline', () => {
		render(<RichTextEditor />)
		const editor = screen.getByRole('textbox', { name: 'Email body' })
		expect(editor).toHaveAttribute('aria-multiline', 'true')
	})
})
