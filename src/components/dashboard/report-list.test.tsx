import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ReportList, Pagination, EmptyState } from './report-list'
import type { Report } from '@/hooks/use-reports'

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn() }),
}))

const mockReports: Report[] = [
	{
		id: '1',
		userId: 'user-1',
		title: 'Accident Report #1',
		status: 'DRAFT',
		completionPercentage: 25,
		isLocked: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		_count: { photos: 5 },
	},
	{
		id: '2',
		userId: 'user-1',
		title: 'Insurance Claim #42',
		status: 'COMPLETED',
		completionPercentage: 100,
		isLocked: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		_count: { photos: 12 },
	},
	{
		id: '3',
		userId: 'user-1',
		title: 'Vehicle Assessment',
		status: 'SENT',
		completionPercentage: 100,
		isLocked: false,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		_count: { photos: 0 },
	},
]

describe('ReportList', () => {
	const mockOnDelete = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders report titles', () => {
		render(<ReportList reports={mockReports} onDelete={mockOnDelete} />)
		expect(screen.getByText('Accident Report #1')).toBeInTheDocument()
		expect(screen.getByText('Insurance Claim #42')).toBeInTheDocument()
		expect(screen.getByText('Vehicle Assessment')).toBeInTheDocument()
	})

	it('renders status badges', () => {
		render(<ReportList reports={mockReports} onDelete={mockOnDelete} />)
		expect(screen.getAllByText('Draft').length).toBeGreaterThanOrEqual(1)
		expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1)
		expect(screen.getAllByText('Sent').length).toBeGreaterThanOrEqual(1)
	})

	it('renders table headers', () => {
		render(<ReportList reports={mockReports} onDelete={mockOnDelete} />)
		expect(screen.getByText('Report')).toBeInTheDocument()
		expect(screen.getByText('Status')).toBeInTheDocument()
		expect(screen.getByText('Updated')).toBeInTheDocument()
	})

	it('shows action menu on button click', async () => {
		const user = userEvent.setup()
		render(<ReportList reports={mockReports} onDelete={mockOnDelete} />)

		const actionButtons = screen.getAllByLabelText('Report actions')
		await user.click(actionButtons[0]!)

		expect(screen.getByText('Delete')).toBeInTheDocument()
	})

	it('calls onDelete when delete is clicked', async () => {
		const user = userEvent.setup()
		render(<ReportList reports={mockReports} onDelete={mockOnDelete} />)

		const actionButtons = screen.getAllByLabelText('Report actions')
		await user.click(actionButtons[0]!)
		await user.click(screen.getByText('Delete'))

		expect(mockOnDelete).toHaveBeenCalledWith('1')
	})
})

describe('EmptyState', () => {
	it('renders empty state message', () => {
		render(<EmptyState />)
		expect(screen.getByText('No reports yet')).toBeInTheDocument()
		expect(screen.getByText(/Create your first report/)).toBeInTheDocument()
	})
})

describe('Pagination', () => {
	it('renders page info', () => {
		render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />)
		expect(screen.getByText('Page 2 of 5')).toBeInTheDocument()
	})

	it('renders Previous and Next buttons', () => {
		render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />)
		expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
	})

	it('disables Previous on first page', () => {
		render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />)
		expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
	})

	it('disables Next on last page', () => {
		render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />)
		expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
	})

	it('calls onPageChange when clicking Next', async () => {
		const user = userEvent.setup()
		const mockOnPageChange = vi.fn()
		render(<Pagination page={2} totalPages={5} onPageChange={mockOnPageChange} />)
		await user.click(screen.getByRole('button', { name: 'Next' }))
		expect(mockOnPageChange).toHaveBeenCalledWith(3)
	})

	it('calls onPageChange when clicking Previous', async () => {
		const user = userEvent.setup()
		const mockOnPageChange = vi.fn()
		render(<Pagination page={3} totalPages={5} onPageChange={mockOnPageChange} />)
		await user.click(screen.getByRole('button', { name: 'Previous' }))
		expect(mockOnPageChange).toHaveBeenCalledWith(2)
	})

	it('returns null for single page', () => {
		const { container } = render(
			<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
		)
		expect(container.innerHTML).toBe('')
	})
})
