import { cn } from '@/lib/utils'

type LicensePlateProps = {
  plate: string
  country?: string
  className?: string
}

function LicensePlate({ plate, className }: LicensePlateProps) {
  // Split plate into city code and rest (e.g. "ES 1315" → "XX" + "ES 1315")
  // German plates: "XX · ES 1315" format in Figma
  const parts = plate.split(' ')
  const cityCode = parts.length >= 2 ? parts[0] : 'XX'
  const rest = parts.length >= 2 ? parts.slice(1).join(' ') : plate

  return (
    <div
      className={cn(
        'inline-flex h-8 items-center overflow-hidden rounded-[4px] border border-black/12 bg-white shadow-[0px_4px_14px_rgba(0,0,0,0.1)]',
        className,
      )}
      aria-label={`License plate: ${plate}`}
    >
      <div className="flex h-8 w-[14px] shrink-0 items-center justify-center rounded-l-[4px] bg-[#0066CC]" />
      <div className="flex items-center gap-1.5 px-3">
        <span className="text-[16px] font-medium leading-[18px] text-[#121312]">{cityCode}</span>
        <div className="flex flex-col gap-1">
          <div className="h-1 w-1 rounded-full bg-[#121312]" />
          <div className="h-1 w-1 rounded-full bg-[#121312]" />
        </div>
        <span className="text-[16px] font-medium leading-[18px] text-[#121312]">{rest}</span>
      </div>
    </div>
  )
}

export { LicensePlate }
export type { LicensePlateProps }
