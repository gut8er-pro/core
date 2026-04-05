import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RenderOptions, render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement, ReactNode } from 'react'
import messages from '@/messages/en.json'

function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	})
}

function AllProviders({ children }: { children: ReactNode }) {
	const queryClient = createTestQueryClient()
	return (
		<QueryClientProvider client={queryClient}>
			<NextIntlClientProvider locale="en" messages={messages}>
				{children}
			</NextIntlClientProvider>
		</QueryClientProvider>
	)
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
	return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
