import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SignaturePad } from './signature-pad'

describe('SignaturePad', () => {
	it('renders draw and upload tabs', () => {
		render(<SignaturePad />)
		expect(screen.getByText('Draw Signature')).toBeInTheDocument()
		expect(screen.getByText('Upload Signature')).toBeInTheDocument()
	})

	it('shows draw mode by default', () => {
		render(<SignaturePad />)
		const drawTab = screen.getByText('Draw Signature')
		expect(drawTab).toHaveAttribute('aria-selected', 'true')
	})

	it('renders canvas in draw mode', () => {
		render(<SignaturePad />)
		expect(screen.getByLabelText('Signature canvas')).toBeInTheDocument()
	})

	it('renders clear button in draw mode', () => {
		render(<SignaturePad />)
		expect(screen.getByText('Clear')).toBeInTheDocument()
	})

	it('switches to upload mode on tab click', async () => {
		const user = userEvent.setup()
		render(<SignaturePad />)
		await user.click(screen.getByText('Upload Signature'))
		const uploadTab = screen.getByText('Upload Signature')
		expect(uploadTab).toHaveAttribute('aria-selected', 'true')
		expect(screen.getByText('Choose File')).toBeInTheDocument()
	})

	it('shows legal disclaimer', () => {
		render(<SignaturePad />)
		expect(screen.getByText(/By signing/)).toBeInTheDocument()
	})

	it('renders with initial upload mode', () => {
		render(<SignaturePad mode="upload" />)
		expect(screen.getByText('Choose File')).toBeInTheDocument()
	})

	it('shows uploaded image when value is provided in upload mode', () => {
		render(<SignaturePad mode="upload" value="data:image/png;base64,abc123" />)
		const img = screen.getByAltText('Uploaded signature')
		expect(img).toHaveAttribute('src', 'data:image/png;base64,abc123')
	})
})
