import dynamic from 'next/dynamic'
import type { SignaturePadProps } from './signature-pad'

const SignaturePad = dynamic(
	() => import('./signature-pad').then((m) => m.SignaturePad),
	{
		ssr: false,
		loading: () => (
			<div className="flex flex-col gap-4">
				<div className="flex gap-1">
					<div className="h-10 w-32 animate-pulse rounded-full bg-grey-25" />
					<div className="h-10 w-32 animate-pulse rounded-full bg-grey-25" />
				</div>
				<div className="h-[200px] animate-pulse rounded-lg border border-border bg-grey-25" />
			</div>
		),
	},
)

export { SignaturePad }
export type { SignaturePadProps }
