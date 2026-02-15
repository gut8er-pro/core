import { CheckCircle2, Info, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

type InstructionSidebarProps = {
	className?: string
}

const PHOTO_TIPS = [
	{ text: 'Take photos in good lighting', icon: 'check' },
	{ text: 'Avoid using flash', icon: 'check' },
	{ text: 'Capture all 4 diagonal angles', icon: 'check' },
	{ text: 'Include close-ups of all damage', icon: 'check' },
	{ text: 'Photograph VIN plate and registration', icon: 'check' },
	{ text: 'Maximum 20 photos per report', icon: 'info' },
] as const

const SUGGESTED_PHOTOS = [
	'Front Left',
	'Front Right',
	'Rear Left',
	'Rear Right',
	'VIN Plate',
	'Registration',
	'Damage Overview',
	'Damage Detail',
] as const

function InstructionSidebar({ className }: InstructionSidebarProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-8 rounded-xl bg-surface-secondary p-6',
				className,
			)}
		>
			{/* Photo Tips Section */}
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-2">
					<Camera className="h-5 w-5 text-primary" />
					<h3 className="text-h4 font-semibold text-black">
						Photo Tips
					</h3>
				</div>

				<ul className="flex flex-col gap-3">
					{PHOTO_TIPS.map((tip) => (
						<li
							key={tip.text}
							className="flex items-start gap-3"
						>
							{tip.icon === 'check' ? (
								<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
							) : (
								<Info className="mt-0.5 h-4 w-4 shrink-0 text-grey-100" />
							)}
							<span className="text-body-sm text-black">
								{tip.text}
							</span>
						</li>
					))}
				</ul>
			</div>

			{/* Divider */}
			<div className="h-px bg-border" />

			{/* Suggested Photos Section */}
			<div className="flex flex-col gap-4">
				<h3 className="text-h4 font-semibold text-black">
					Suggested Photos
				</h3>

				<div className="grid grid-cols-2 gap-2">
					{SUGGESTED_PHOTOS.map((label) => (
						<div
							key={label}
							className="flex items-center justify-center rounded-md border border-border bg-white px-2 py-1 text-center text-caption font-semibold text-grey-100"
						>
							{label}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export { InstructionSidebar }
export type { InstructionSidebarProps }
