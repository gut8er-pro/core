import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/test-utils'
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
	})

	it('reports typed content through onChange', () => {
		const onChange = vi.fn()
		render(<RichTextEditor onChange={onChange} />)
		const editor = screen.getByRole('textbox', { name: 'Email body' })
		editor.innerHTML = '<p>Hallo</p>'
		fireEvent.input(editor)
		expect(onChange).toHaveBeenCalledWith('<p>Hallo</p>')
	})

	it('applies a formatting command and reports the result', () => {
		const onChange = vi.fn()
		document.execCommand = vi.fn().mockReturnValue(true)
		render(<RichTextEditor onChange={onChange} />)
		fireEvent.click(screen.getByLabelText('Bold'))
		expect(document.execCommand).toHaveBeenCalledWith('bold')
		expect(onChange).toHaveBeenCalled()
	})

	it('syncs an externally loaded value into the editor', () => {
		const { rerender } = render(<RichTextEditor value="" />)
		rerender(<RichTextEditor value="<p>Gespeichert</p>" />)
		const editor = screen.getByRole('textbox', { name: 'Email body' })
		expect(editor.innerHTML).toContain('Gespeichert')
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
