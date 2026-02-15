import { cn } from '@/lib/utils'

type ChipOption = {
  value: string
  label: string
}

type NumberChipSelectorProps = {
  options: ChipOption[]
  selected: string
  onChange: (value: string) => void
  className?: string
}

function NumberChipSelector({ options, selected, onChange, className }: NumberChipSelectorProps) {
  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)} role="radiogroup">
      {options.map((option) => {
        const isSelected = option.value === selected
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-body-sm font-medium transition-colors',
              isSelected
                ? 'bg-primary text-white'
                : 'border border-border bg-white text-black hover:bg-grey-25',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export { NumberChipSelector }
export type { NumberChipSelectorProps, ChipOption }
