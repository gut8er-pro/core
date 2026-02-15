import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ArrowRight } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('renders primary variant by default', () => {
    render(<Button>Primary</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-primary')
  })

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('border')
    expect(button.className).toContain('bg-surface-secondary')
  })

  it('renders outline variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('border')
    expect(button.className).toContain('bg-transparent')
  })

  it('renders danger variant', () => {
    render(<Button variant="danger">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button.className).toContain('border-black')
  })

  it('renders all sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button').className).toContain('h-8')

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByRole('button').className).toContain('h-10')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button').className).toContain('h-12')
  })

  it('handles click events', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows spinner when loading', () => {
    render(<Button loading>Loading</Button>)
    const button = screen.getByRole('button')
    expect(button.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders icon on the left by default', () => {
    render(<Button icon={<ArrowRight data-testid="icon" />}>Next</Button>)
    const button = screen.getByRole('button')
    const icon = screen.getByTestId('icon')
    expect(button.firstElementChild?.firstElementChild).toBe(icon)
  })

  it('renders icon on the right when specified', () => {
    render(
      <Button icon={<ArrowRight data-testid="icon" />} iconPosition="right">
        Next
      </Button>,
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Full</Button>)
    expect(screen.getByRole('button').className).toContain('w-full')
  })

  it('does not fire click when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        No click
      </Button>,
    )
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
