import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { Search } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { TextField } from './text-field'

describe('TextField', () => {
  it('renders with label', () => {
    render(<TextField label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('renders without label', () => {
    render(<TextField placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<TextField label="Email" error="Email is required" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required')
  })

  it('shows hint when no error', () => {
    render(<TextField label="Email" hint="Enter your work email" />)
    expect(screen.getByText('Enter your work email')).toBeInTheDocument()
  })

  it('hides hint when error is present', () => {
    render(<TextField label="Email" hint="Enter your work email" error="Required" />)
    expect(screen.queryByText('Enter your work email')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
  })

  it('applies error styling to input', () => {
    render(<TextField label="Email" error="Required" />)
    const input = screen.getByLabelText('Email')
    expect(input.className).toContain('border-error')
  })

  it('sets aria-invalid when error is present', () => {
    render(<TextField label="Email" error="Invalid" />)
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<TextField label="Password" type="password" />)
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(input).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(input).toHaveAttribute('type', 'password')
  })

  it('renders prefix', () => {
    render(<TextField label="Amount" prefix="EUR" />)
    expect(screen.getByText('EUR')).toBeInTheDocument()
  })

  it('renders icon', () => {
    render(<TextField label="Search" icon={<Search data-testid="search-icon" />} />)
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('handles user input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TextField label="Name" onChange={onChange} />)
    await user.type(screen.getByLabelText('Name'), 'John')
    expect(onChange).toHaveBeenCalled()
  })

  it('is disabled when disabled prop set', () => {
    render(<TextField label="Email" disabled />)
    expect(screen.getByLabelText('Email')).toBeDisabled()
  })
})
