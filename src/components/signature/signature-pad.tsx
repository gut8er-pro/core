import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type SignaturePadProps = {
	mode?: 'draw' | 'upload'
	value?: string
	onChange?: (value: string) => void
	className?: string
}

function applyStrokeStyle(ctx: CanvasRenderingContext2D) {
	ctx.lineWidth = 2
	ctx.lineCap = 'round'
	ctx.strokeStyle = '#000'
}

function SignaturePad({
	mode: initialMode = 'draw',
	value,
	onChange,
	className,
}: SignaturePadProps) {
	const t = useTranslations('report.signature')
	const [mode, setMode] = useState(initialMode)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [isDrawing, setIsDrawing] = useState(false)

	const syncBackingStore = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const rect = canvas.getBoundingClientRect()
		if (rect.width === 0 || rect.height === 0) return

		const ratio = window.devicePixelRatio || 1
		const width = Math.round(rect.width * ratio)
		const height = Math.round(rect.height * ratio)
		if (canvas.width === width && canvas.height === height) return

		const previous = canvas.width > 0 && canvas.height > 0 ? canvas.toDataURL('image/png') : null
		canvas.width = width
		canvas.height = height

		const ctx = canvas.getContext('2d')
		if (!ctx) return
		ctx.scale(ratio, ratio)
		applyStrokeStyle(ctx)

		if (previous) {
			const image = new Image()
			image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height)
			image.src = previous
		}
	}, [])

	useEffect(() => {
		if (mode !== 'draw') return
		syncBackingStore()
		window.addEventListener('resize', syncBackingStore)
		return () => window.removeEventListener('resize', syncBackingStore)
	}, [mode, syncBackingStore])

	function startDrawing(e: React.MouseEvent<HTMLCanvasElement>) {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		setIsDrawing(true)
		const rect = canvas.getBoundingClientRect()
		applyStrokeStyle(ctx)
		ctx.beginPath()
		ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
	}

	function draw(e: React.MouseEvent<HTMLCanvasElement>) {
		if (!isDrawing) return
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		const rect = canvas.getBoundingClientRect()
		ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
		ctx.stroke()
	}

	function stopDrawing() {
		setIsDrawing(false)
		const canvas = canvasRef.current
		if (!canvas) return
		const dataUrl = canvas.toDataURL('image/png')
		onChange?.(dataUrl)
	}

	function clearCanvas() {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		const rect = canvas.getBoundingClientRect()
		ctx.clearRect(0, 0, rect.width, rect.height)
		onChange?.('')
	}

	function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0]
		if (!file) return
		const reader = new FileReader()
		reader.onloadend = () => {
			const result = reader.result as string
			onChange?.(result)
		}
		reader.readAsDataURL(file)
	}

	return (
		<div className={cn('flex flex-col gap-4', className)}>
			<div className="flex gap-1" role="tablist">
				<button
					type="button"
					role="tab"
					aria-selected={mode === 'draw'}
					onClick={() => setMode('draw')}
					className={cn(
						'cursor-pointer rounded-full px-4 py-2 text-body-sm font-medium transition-colors',
						mode === 'draw' ? 'bg-black text-white' : 'text-grey-100 hover:bg-grey-25',
					)}
				>
					{t('draw')}
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={mode === 'upload'}
					onClick={() => setMode('upload')}
					className={cn(
						'cursor-pointer rounded-full px-4 py-2 text-body-sm font-medium transition-colors',
						mode === 'upload' ? 'bg-black text-white' : 'text-grey-100 hover:bg-grey-25',
					)}
				>
					{t('upload')}
				</button>
			</div>

			{mode === 'draw' ? (
				<div className="flex flex-col gap-2">
					<div className="rounded-lg border border-border bg-white">
						<canvas
							ref={canvasRef}
							className="h-50 w-full cursor-crosshair touch-none"
							onMouseDown={startDrawing}
							onMouseMove={draw}
							onMouseUp={stopDrawing}
							onMouseLeave={stopDrawing}
							aria-label={t('canvas')}
						/>
					</div>
					<button
						type="button"
						onClick={clearCanvas}
						className="cursor-pointer self-start text-body-sm font-medium text-grey-100 hover:text-black"
					>
						{t('clear')}
					</button>
				</div>
			) : (
				<div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-border p-8">
					{value ? (
						<img src={value} alt={t('uploadedAlt')} className="max-h-32" />
					) : (
						<p className="text-body-sm text-grey-100">{t('uploadHint')}</p>
					)}
					<label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-body-sm font-medium text-white hover:bg-primary-hover">
						{t('chooseFile')}
						<input
							type="file"
							accept="image/png,image/jpeg"
							onChange={handleFileUpload}
							className="hidden"
						/>
					</label>
				</div>
			)}

			<p className="text-caption text-grey-100">{t('disclaimer')}</p>
		</div>
	)
}

export type { SignaturePadProps }
export { SignaturePad }
