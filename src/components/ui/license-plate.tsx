import { cn } from '@/lib/utils'

type LicensePlateProps = {
  plate: string
  country?: string
  className?: string
}

function LicensePlate({ plate, country = 'D', className }: LicensePlateProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-sm border-2 border-black bg-white overflow-hidden',
        className,
      )}
      aria-label={`License plate: ${plate}`}
    >
      <div className="flex h-8 w-7 flex-col items-center justify-center bg-info-blue text-white">
        <span className="text-[8px] leading-none">EU</span>
        <span className="text-caption font-bold leading-none">{country}</span>
      </div>
      <span className="px-3 py-1 text-body-sm font-bold tracking-wider text-black">{plate}</span>
    </div>
  )
}

export { LicensePlate }
export type { LicensePlateProps }
