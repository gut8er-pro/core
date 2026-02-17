import Image from 'next/image'
import { cn } from '@/lib/utils'

const BRAND_LOGOS: Record<string, string> = {
	bmw: '/images/brands/bmw.svg',
	mercedes: '/images/brands/mercedes.svg',
	'mercedes-benz': '/images/brands/mercedes.svg',
	audi: '/images/brands/audi.svg',
	volkswagen: '/images/brands/volkswagen.svg',
	vw: '/images/brands/volkswagen.svg',
	opel: '/images/brands/opel.svg',
	ford: '/images/brands/ford.svg',
	toyota: '/images/brands/toyota.svg',
	kia: '/images/brands/kia.svg',
	renault: '/images/brands/renault.svg',
	citroen: '/images/brands/citroen.svg',
	citroën: '/images/brands/citroen.svg',
}

type CarBrandLogoProps = {
	make: string
	className?: string
}

function CarBrandLogo({ make, className }: CarBrandLogoProps) {
	const key = make.toLowerCase().trim()
	const logoPath = BRAND_LOGOS[key]

	if (logoPath) {
		return (
			<div
				className={cn(
					'flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white',
					className,
				)}
			>
				<Image
					src={logoPath}
					alt={make}
					width={21}
					height={21}
					className="object-contain"
				/>
			</div>
		)
	}

	// Fallback: letter in circle
	return (
		<div
			className={cn(
				'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grey-25',
				className,
			)}
		>
			<span className="text-[10px] font-bold text-grey-100">
				{make.charAt(0).toUpperCase()}
			</span>
		</div>
	)
}

export { CarBrandLogo }
export type { CarBrandLogoProps }
