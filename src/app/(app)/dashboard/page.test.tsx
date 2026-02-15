import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import DashboardPage from './page'

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/hooks/use-reports', () => ({
	useReports: () => ({
		data: {
			reports: [
				{
					id: '1',
					userId: 'u1',
					title: 'Test Report',
					status: 'DRAFT',
					completionPercentage: 50,
					isLocked: false,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					_count: { photos: 3 },
				},
			],
			pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
		},
		isLoading: false,
		error: null,
	}),
	useCreateReport: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
	useDeleteReport: () => ({
		mutate: vi.fn(),
		isPending: false,
	}),
}))

describe('DashboardPage', () => {
	it('renders the page heading', () => {
		render(<DashboardPage />)
		expect(screen.getByText('Reports')).toBeInTheDocument()
	})

	it('renders "New Report" button', () => {
		render(<DashboardPage />)
		expect(screen.getByRole('button', { name: /New Report/i })).toBeInTheDocument()
	})

	it('renders report count', () => {
		render(<DashboardPage />)
		expect(screen.getByText('1 report')).toBeInTheDocument()
	})

	it('renders report list with data', () => {
		render(<DashboardPage />)
		expect(screen.getByText('Test Report')).toBeInTheDocument()
	})
})
