import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ReportTable, Pagination, EmptyState } from './report-list'
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
		claimantName: 'Marko Jovanović',
		plateNumber: 'ES 1315',
		vehicleMake: 'Toyota',
		vehicleModel: 'Sedan',
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
		claimantName: 'Ana Petrović',
		plateNumber: 'AL 1815',
		vehicleMake: 'Ford',
		vehicleModel: 'SUV',
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

describe('ReportTable', () => {
	const mockOnDelete = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders report names from claimant data', () => {
		render(<ReportTable reports={mockReports} onDelete={mockOnDelete} />)
		expect(screen.getByText('Marko Jovanović')).toBeInTheDocument()
		expect(screen.getByText('Ana Petrović')).toBeInTheDocument()
	})

	it('falls back to report title when no claimant name', () => {
		render(<ReportTable reports={mockReports} onDelete={mockOnDelete} />)
		expect(screen.getByText('Vehicle Assessment')).toBeInTheDocument()
	})

	it('renders table headers', () => {
		render(<ReportTable reports={mockReports} onDelete={mockOnDelete} />)
		expect(screen.getByText('Report')).toBeInTheDocument()
	})

	it('shows action menu on button click', async () => {
		const user = userEvent.setup()
		render(<ReportTable reports={mockReports} onDelete={mockOnDelete} />)

		const actionButtons = screen.getAllByLabelText('Report actions')
		await user.click(actionButtons[0]!)

		expect(screen.getByText('Delete')).toBeInTheDocument()
		expect(screen.getByText('Details')).toBeInTheDocument()
		expect(screen.getByText('Edit Report')).toBeInTheDocument()
	})

	it('calls onDelete when delete is clicked', async () => {
		const user = userEvent.setup()
		render(<ReportTable reports={mockReports} onDelete={mockOnDelete} />)

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
