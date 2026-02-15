import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { SignatureSection } from './signature-section'

const emptySignatures = [
	{ id: 's1', type: 'LAWYER', imageUrl: null, signedAt: null },
	{ id: 's2', type: 'DATA_PERMISSION', imageUrl: null, signedAt: null },
	{ id: 's3', type: 'CANCELLATION', imageUrl: null, signedAt: null },
]

const signedSignatures = [
	{
		id: 's1',
		type: 'LAWYER',
		imageUrl: 'https://example.com/sig-lawyer.png',
		signedAt: '2024-06-22T16:30:00+02:00',
	},
	{ id: 's2', type: 'DATA_PERMISSION', imageUrl: null, signedAt: null },
	{ id: 's3', type: 'CANCELLATION', imageUrl: null, signedAt: null },
]

describe('SignatureSection', () => {
	it('renders "Signatures" section title', () => {
		render(
			<SignatureSection
				signatures={emptySignatures}
				onSignatureClick={vi.fn()}
			/>,
		)
		expect(screen.getByText('Signatures')).toBeInTheDocument()
	})

	it('renders 3 signature type cards (Lawyer, Data Permission, Cancellation)', () => {
		render(
			<SignatureSection
				signatures={emptySignatures}
				onSignatureClick={vi.fn()}
			/>,
		)
		expect(screen.getByText('Lawyer')).toBeInTheDocument()
		expect(screen.getByText('Data Permission')).toBeInTheDocument()
		expect(screen.getByText('Cancellation')).toBeInTheDocument()
	})

	it('shows "Add Signature" for unsigned types', () => {
		render(
			<SignatureSection
				signatures={emptySignatures}
				onSignatureClick={vi.fn()}
			/>,
		)
		const addButtons = screen.getAllByText('Add Signature')
		expect(addButtons).toHaveLength(3)
	})

	it('shows signature image when signed', () => {
		render(
			<SignatureSection
				signatures={signedSignatures}
				onSignatureClick={vi.fn()}
			/>,
		)
		const signatureImg = screen.getByAltText('Lawyer signature')
		expect(signatureImg).toBeInTheDocument()
		expect(signatureImg).toHaveAttribute(
			'src',
			'https://example.com/sig-lawyer.png',
		)
		// Unsigned cards still show "Add Signature"
		const addButtons = screen.getAllByText('Add Signature')
		expect(addButtons).toHaveLength(2)
	})

	it('calls onSignatureClick with correct type when card clicked', async () => {
		const user = userEvent.setup()
		const onSignatureClick = vi.fn()
		render(
			<SignatureSection
				signatures={emptySignatures}
				onSignatureClick={onSignatureClick}
			/>,
		)

		await user.click(screen.getByText('Data Permission'))
		expect(onSignatureClick).toHaveBeenCalledWith('DATA_PERMISSION')
	})
})
