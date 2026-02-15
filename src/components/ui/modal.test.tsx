import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './modal'

describe('Modal', () => {
	it('renders when open', () => {
		render(
			<Modal title="Test Modal" open onClose={() => {}}>
				<p>Modal content</p>
			</Modal>,
		)
		expect(screen.getByText('Test Modal')).toBeInTheDocument()
		expect(screen.getByText('Modal content')).toBeInTheDocument()
	})

	it('does not render when closed', () => {
		render(
			<Modal title="Test Modal" open={false} onClose={() => {}}>
				<p>Modal content</p>
			</Modal>,
		)
		expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
	})

	it('calls onClose when close button clicked', async () => {
		const user = userEvent.setup()
		const onClose = vi.fn()
		render(
			<Modal title="Test Modal" open onClose={onClose}>
				<p>Content</p>
			</Modal>,
		)
		await user.click(screen.getByLabelText('Close'))
		expect(onClose).toHaveBeenCalledOnce()
	})

	it('renders title', () => {
		render(
			<Modal title="Signature" open onClose={() => {}}>
				<p>Content</p>
			</Modal>,
		)
		expect(screen.getByText('Signature')).toBeInTheDocument()
	})

	it('renders footer', () => {
		render(
			<Modal title="Test" open onClose={() => {}} footer={<button type="button">Save</button>}>
				<p>Content</p>
			</Modal>,
		)
		expect(screen.getByText('Save')).toBeInTheDocument()
	})

	it('renders children', () => {
		render(
			<Modal title="Test" open onClose={() => {}}>
				<p>Custom content here</p>
			</Modal>,
		)
		expect(screen.getByText('Custom content here')).toBeInTheDocument()
	})
})
