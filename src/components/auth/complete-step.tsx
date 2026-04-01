'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

// Card icon positions within the shared sprite image
const CARD_ICON_STYLE: Record<string, React.CSSProperties> = {
	'create-report': {
		position: 'absolute',
		height: '223.22%',
		left: '-10.8%',
		top: '-56.31%',
		width: '315.47%',
		maxWidth: 'none',
	},
	'enjoy-ai': {
		position: 'absolute',
		height: '235.12%',
		left: '-205.99%',
		top: '-62.92%',
		width: '315.47%',
		maxWidth: 'none',
	},
	settings: {
		position: 'absolute',
		height: '218.17%',
		left: '-112.7%',
		top: '-53.76%',
		width: '323.77%',
		maxWidth: 'none',
	},
}

const QUICK_START_CARDS = [
	{ id: 'create-report', title: 'Create Report', description: 'Start your first assessment' },
	{ id: 'enjoy-ai', title: 'Enjoy AI', description: 'Learn from tooltips' },
	{ id: 'settings', title: 'Settings', description: 'Customize your workspace' },
]

function CompleteStep() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const email = searchParams.get('email')

	return (
		<div className="relative min-h-screen bg-white">
			<div className="relative flex flex-col items-center px-6 pt-20 pb-12">
				{/* 3D check circle */}
				<div className="relative mb-5 h-[151px] w-[149px] overflow-hidden rounded-[100px]">
					<img
						alt="Success"
						src="/images/complete-check.webp"
						className="absolute max-w-none"
						style={{ height: '270.9%', left: '-143.98%', top: '-65.87%', width: '273.8%' }}
					/>
				</div>

				{/* Title + subtitle + badge */}
				<div className="mb-8 flex flex-col items-center gap-6">
					<h1 className="text-center text-[44px] font-medium leading-none text-black">
						Welcome aboard!
					</h1>
					<p className="text-center text-[23px] leading-snug tracking-[0.23px] text-black">
						Your account has been created successfully.
					</p>
					{/* Pro Plan badge */}
					<div className="flex items-center gap-2.5 overflow-hidden rounded-[100px] border-2 border-primary bg-primary/5 px-[25px] py-3">
						<Image src="/images/pro-plan-icon.svg" alt="" width={24} height={24} />
						<span className="text-[18px] font-medium tracking-[0.18px] text-primary">Pro Plan</span>
						<span className="text-[18px] text-black">•</span>
						<span className="text-[18px] tracking-[0.18px] text-black">14-day free trial started</span>
					</div>
				</div>

				{/* Quick-start cards */}
				<div className="mb-8 grid w-full max-w-[846px] grid-cols-3 gap-3.5">
					{QUICK_START_CARDS.map((card) => (
						<div
							key={card.id}
							className="flex flex-col items-center gap-3.5 rounded-[24px] border-2 border-[#e5e7eb] bg-white p-6"
						>
							{/* Icon from sprite */}
							<div className="relative h-[59px] w-[60px] overflow-hidden rounded-[18px] border-2 border-[#e5e7eb]">
								<img
									alt=""
									src="/images/complete-card-icons.webp"
									className="pointer-events-none"
									style={CARD_ICON_STYLE[card.id]}
								/>
							</div>
							<div className="flex flex-col items-center gap-[7px]">
								<p className="text-[23px] font-medium text-black">{card.title}</p>
								<p className="text-center text-[18px] tracking-[0.18px] text-black/70">
									{card.description}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* Action buttons */}
				<div className="flex w-full max-w-[846px] gap-3.5">
					<button
						type="button"
						onClick={() => router.push('/dashboard')}
						className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] border-2 border-[#e5e7eb] bg-white px-[30px] text-[18px] font-medium text-black transition-colors hover:bg-grey-25"
					>
						Create your first report
					</button>
					<button
						type="button"
						onClick={() => router.push('/dashboard')}
						className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] bg-primary px-[30px] text-[18px] font-medium text-white transition-colors hover:bg-primary-hover"
					>
						Go to Dashboard
					</button>
				</div>

				{/* Confirmation email */}
				<p className="mt-8 text-center text-[16px] text-black">
					We&apos;ve sent a confirmation email to{" "}
					<span className="font-medium">{email ?? 'your email'}</span>
				</p>
			</div>
		</div>
	)
}

export { CompleteStep }
