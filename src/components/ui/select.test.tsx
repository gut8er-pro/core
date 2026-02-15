import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SelectField } from './select'

const options = [
  { value: 'mr', label: 'Mr' },
  { value: 'mrs', label: 'Mrs' },
  { value: 'dr', label: 'Dr' },
]

describe('SelectField', () => {
  it('renders with label', () => {
    render(<SelectField label="Title" options={options} />)
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('shows placeholder', () => {
    render(<SelectField label="Title" options={options} placeholder="Choose title" />)
    expect(screen.getByText('Choose title')).toBeInTheDocument()
  })

  it('renders combobox trigger', () => {
    render(<SelectField label="Title" options={options} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('opens dropdown on click and shows options', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<SelectField label="Title" options={options} />)
    await user.click(screen.getByRole('combobox'))
    // Radix renders options in portal — use getAllByRole for option items
    const optionElements = screen.getAllByRole('option')
    expect(optionElements.length).toBe(3)
  })

  it('calls onValueChange when option selected', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onValueChange = vi.fn()
    render(<SelectField label="Title" options={options} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('combobox'))
    const mrsOption = screen.getAllByRole('option').find((el) => el.textContent === 'Mrs')
    expect(mrsOption).toBeDefined()
    if (mrsOption) await user.click(mrsOption)
    expect(onValueChange).toHaveBeenCalledWith('mrs')
  })

  it('shows error message', () => {
    render(<SelectField label="Title" options={options} error="Title is required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Title is required')
  })

  it('is disabled when disabled prop set', () => {
    render(<SelectField label="Title" options={options} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('shows selected value', () => {
    render(<SelectField label="Title" options={options} value="dr" />)
    expect(screen.getByText('Dr')).toBeInTheDocument()
  })
})
