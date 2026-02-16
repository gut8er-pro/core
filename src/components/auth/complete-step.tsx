'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, FileText, Sparkles, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const QUICK_START_CARDS = [
	{
		icon: FileText,
		title: 'Create Report',
		description: 'Start your first assessment',
	},
	{
		icon: Sparkles,
		title: 'Enjoy AI',
		description: 'Learn from tooltips',
	},
	{
		icon: Settings,
		title: 'Settings',
		description: 'Customize your workspace',
	},
]

function CompleteStep() {
	const router = useRouter()
	const searchParams = useSearchParams()

	const email = searchParams.get('email')

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-primary-light to-white px-6 py-8">
			<div className="w-full max-w-2xl text-center">
				<div className="mb-6 flex justify-center">
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
						<CheckCircle2 className="h-12 w-12 text-primary" />
					</div>
				</div>

				<h1 className="mb-1 text-h1 font-bold text-black">Welcome aboard!</h1>
				<p className="mb-4 text-body text-grey-100">
					Your account has been created successfully.
				</p>

				<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white px-5 py-2">
					<Sparkles className="h-4 w-4 text-primary" />
					<span className="text-body-sm font-semibold text-primary">Pro Plan</span>
					<span className="text-body-sm text-grey-100">&middot; 14-day free trial started</span>
				</div>

				<div className="mb-8 grid grid-cols-3 gap-4">
					{QUICK_START_CARDS.map((card) => (
						<Card key={card.title} variant="selectable" padding="md">
							<div className="flex flex-col items-center gap-2 text-center">
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-light">
									<card.icon className="h-6 w-6 text-primary" />
								</div>
								<div>
									<p className="text-body-sm font-semibold text-black">{card.title}</p>
									<p className="text-caption text-grey-100">{card.description}</p>
								</div>
							</div>
						</Card>
					))}
				</div>

				<div className="mb-8 flex items-center justify-center gap-4">
					<Button
						type="button"
						variant="outline"
						size="lg"
						onClick={() => router.push('/dashboard')}
						className="min-w-50"
					>
						Create your first report
					</Button>
					<Button
						type="button"
						size="lg"
						onClick={() => router.push('/dashboard')}
						className="min-w-50"
					>
						Go to Dashboard
					</Button>
				</div>

				{email && (
					<p className="text-caption text-grey-100">
						We've sent a confirmation email to{' '}
						<span className="font-semibold text-black">{email}</span>
					</p>
				)}
			</div>
		</div>
	)
}

export { CompleteStep }
