'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type ErrorBoundaryProps = {
	children: ReactNode
	fallback?: ReactNode
}

type ErrorBoundaryState = {
	hasError: boolean
	error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props)
		this.state = { hasError: false, error: null }
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log to console — replace with Sentry or similar in production
		console.error('ErrorBoundary caught an error:', error, errorInfo)
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null })
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback
			}

			return (
				<div className="flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-lg border border-border bg-white p-8 text-center">
					<div className="flex flex-col items-center gap-2">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-error-light">
							<svg
								className="h-8 w-8 text-error"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
						<h2 className="text-h3 font-semibold text-black">
							Something went wrong
						</h2>
						<p className="max-w-md text-body-sm text-grey-100">
							An unexpected error occurred. Please try again. If the problem
							persists, contact support.
						</p>
					</div>
					<Button variant="primary" onClick={this.handleReset}>
						Try Again
					</Button>
				</div>
			)
		}

		return this.props.children
	}
}

export { ErrorBoundary }
