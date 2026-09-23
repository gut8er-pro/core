import { fireEvent, render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import en from '@/messages/en.json'
import { EmailComposer } from './email-composer'

vi.mock('@/components/ui/rich-text-editor.dynamic', () => ({
	RichTextEditor: () => <div />,
}))

function wrap(children: ReactNode) {
	return (
		<NextIntlClientProvider locale="en" messages={en}>
			{children}
		</NextIntlClientProvider>
	)
}

const baseProps = {
	register: (() => ({})) as never,
	errors: {},
	body: '',
	recipientMode: null,
	onBodyChange: vi.fn(),
	onSubjectBlur: vi.fn(),
}

describe('EmailComposer presets', () => {
	it('replaces the chips with the preset addresses', () => {
		const onRecipientsChange = vi.fn()
		const onRecipientModeChange = vi.fn()
		render(
			wrap(
				<EmailComposer
					{...baseProps}
					recipients={['old@example.test']}
					presets={{ claimant: 'claimant@example.test', lawyer: 'lawyer@example.test' }}
					onRecipientsChange={onRecipientsChange}
					onRecipientModeChange={onRecipientModeChange}
				/>,
			),
		)

		fireEvent.click(screen.getByRole('button', { name: 'Send to the claimant and their lawyer' }))

		expect(onRecipientsChange).toHaveBeenCalledWith([
			'claimant@example.test',
			'lawyer@example.test',
		])
		expect(onRecipientModeChange).toHaveBeenCalledWith('claimant_lawyer')
	})

	it('never wipes existing chips when the preset has no address', () => {
		const onRecipientsChange = vi.fn()
		const onRecipientModeChange = vi.fn()
		const onPresetEmpty = vi.fn()
		render(
			wrap(
				<EmailComposer
					{...baseProps}
					recipients={['kept@example.test']}
					presets={{ claimant: null, lawyer: null }}
					onRecipientsChange={onRecipientsChange}
					onRecipientModeChange={onRecipientModeChange}
					onPresetEmpty={onPresetEmpty}
				/>,
			),
		)

		fireEvent.click(screen.getByRole('button', { name: 'Send to the claimant' }))

		expect(onRecipientsChange).not.toHaveBeenCalled()
		expect(onRecipientModeChange).not.toHaveBeenCalled()
		expect(onPresetEmpty).toHaveBeenCalledWith('claimant')
	})

	it('fills what exists and flags the missing lawyer on a partial preset', () => {
		const onRecipientsChange = vi.fn()
		const onRecipientModeChange = vi.fn()
		const onPresetPartial = vi.fn()
		render(
			wrap(
				<EmailComposer
					{...baseProps}
					recipients={[]}
					presets={{ claimant: 'claimant@example.test', lawyer: null }}
					onRecipientsChange={onRecipientsChange}
					onRecipientModeChange={onRecipientModeChange}
					onPresetPartial={onPresetPartial}
				/>,
			),
		)

		fireEvent.click(screen.getByRole('button', { name: 'Send to the claimant and their lawyer' }))

		expect(onRecipientsChange).toHaveBeenCalledWith(['claimant@example.test'])
		expect(onRecipientModeChange).toHaveBeenCalledWith('claimant_lawyer')
		expect(onPresetPartial).toHaveBeenCalledWith('claimant_lawyer')
	})

	it('disables the preset buttons while the presets are loading', () => {
		render(
			wrap(
				<EmailComposer
					{...baseProps}
					recipients={[]}
					presets={{ claimant: null, lawyer: null }}
					presetsLoading
					onRecipientsChange={vi.fn()}
					onRecipientModeChange={vi.fn()}
				/>,
			),
		)

		expect(screen.getByRole('button', { name: 'Send to the claimant' })).toBeDisabled()
		expect(
			screen.getByRole('button', { name: 'Send to the claimant and their lawyer' }),
		).toBeDisabled()
	})
})
