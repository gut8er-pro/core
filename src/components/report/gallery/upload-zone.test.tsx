import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { UploadZone } from './upload-zone'

describe('UploadZone', () => {
	it('renders drag & drop message', () => {
		render(<UploadZone onFilesSelected={vi.fn()} />)
		expect(screen.getByText('Drag & drop photos here')).toBeInTheDocument()
	})

	it('shows file count "0 / 20 photos"', () => {
		render(<UploadZone onFilesSelected={vi.fn()} />)
		expect(screen.getByText('0 / 20 photos')).toBeInTheDocument()
	})

	it('shows current count when provided', () => {
		render(<UploadZone onFilesSelected={vi.fn()} currentCount={5} />)
		expect(screen.getByText('5 / 20 photos')).toBeInTheDocument()
	})

	it('shows "Maximum photos reached" when currentCount >= maxFiles', () => {
		render(
			<UploadZone onFilesSelected={vi.fn()} currentCount={20} maxFiles={20} />,
		)
		expect(screen.getByText('Maximum photos reached')).toBeInTheDocument()
		expect(
			screen.queryByText('Drag & drop photos here'),
		).not.toBeInTheDocument()
	})

	it('upload button is disabled when disabled prop is true', () => {
		render(<UploadZone onFilesSelected={vi.fn()} disabled />)
		const zone = screen.getByRole('button', { name: 'Upload photos' })
		expect(zone).toHaveAttribute('aria-disabled', 'true')
	})

	it('calls onFilesSelected when files are selected via click', async () => {
		const user = userEvent.setup()
		const onFilesSelected = vi.fn()
		render(<UploadZone onFilesSelected={onFilesSelected} />)

		const file = new File(['photo-data'], 'test-photo.jpg', {
			type: 'image/jpeg',
		})
		const input = document.querySelector(
			'input[type="file"]',
		) as HTMLInputElement
		await user.upload(input, file)

		expect(onFilesSelected).toHaveBeenCalledOnce()
		expect(onFilesSelected).toHaveBeenCalledWith([file])
	})
})
