'use client'

import { useCallback, useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

type UploadZoneProps = {
	onFilesSelected: (files: File[]) => void
	maxFiles?: number
	currentCount?: number
	disabled?: boolean
	className?: string
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPT_STRING = ACCEPTED_TYPES.join(',')

function UploadZone({
	onFilesSelected,
	maxFiles = 20,
	currentCount = 0,
	disabled = false,
	className,
}: UploadZoneProps) {
	const [isDragOver, setIsDragOver] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	const isMaxReached = currentCount >= maxFiles
	const isDisabled = disabled || isMaxReached

	const filterValidFiles = useCallback(
		(fileList: FileList | null): File[] => {
			if (!fileList) return []
			const remaining = maxFiles - currentCount
			return Array.from(fileList)
				.filter((file) => ACCEPTED_TYPES.includes(file.type))
				.slice(0, Math.max(0, remaining))
		},
		[maxFiles, currentCount],
	)

	const handleDragEnter = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault()
			event.stopPropagation()
			if (!isDisabled) {
				setIsDragOver(true)
			}
		},
		[isDisabled],
	)

	const handleDragLeave = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault()
			event.stopPropagation()
			setIsDragOver(false)
		},
		[],
	)

	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault()
			event.stopPropagation()
			if (!isDisabled) {
				setIsDragOver(true)
			}
		},
		[isDisabled],
	)

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault()
			event.stopPropagation()
			setIsDragOver(false)

			if (isDisabled) return

			const validFiles = filterValidFiles(event.dataTransfer.files)
			if (validFiles.length > 0) {
				onFilesSelected(validFiles)
			}
		},
		[isDisabled, filterValidFiles, onFilesSelected],
	)

	const handleClick = useCallback(() => {
		if (!isDisabled && inputRef.current) {
			inputRef.current.click()
		}
	}, [isDisabled])

	const handleInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const validFiles = filterValidFiles(event.target.files)
			if (validFiles.length > 0) {
				onFilesSelected(validFiles)
			}
			// Reset the input so the same file can be selected again
			if (inputRef.current) {
				inputRef.current.value = ''
			}
		},
		[filterValidFiles, onFilesSelected],
	)

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault()
				handleClick()
			}
		},
		[handleClick],
	)

	return (
		<div
			role="button"
			tabIndex={isDisabled ? -1 : 0}
			aria-label="Upload photos"
			aria-disabled={isDisabled}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
			className={cn(
				'relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-colors',
				isDisabled
					? 'cursor-not-allowed border-grey-50 bg-grey-25 opacity-60'
					: isDragOver
						? 'border-primary bg-primary-light cursor-copy'
						: 'border-grey-50 bg-grey-25 hover:border-primary hover:bg-primary-light cursor-pointer',
				className,
			)}
		>
			<input
				ref={inputRef}
				type="file"
				accept={ACCEPT_STRING}
				multiple
				onChange={handleInputChange}
				className="hidden"
				aria-hidden="true"
				tabIndex={-1}
				disabled={isDisabled}
			/>

			<div
				className={cn(
					'flex h-14 w-14 items-center justify-center rounded-full',
					isDragOver && !isDisabled
						? 'bg-primary text-white'
						: 'bg-white text-grey-100',
				)}
			>
				{isDragOver && !isDisabled ? (
					<Upload className="h-6 w-6" />
				) : (
					<Camera className="h-6 w-6" />
				)}
			</div>

			<div className="flex flex-col items-center gap-1 text-center">
				<p className="text-body font-semibold text-black">
					{isMaxReached
						? 'Maximum photos reached'
						: 'Drag & drop photos here'}
				</p>
				{!isMaxReached && (
					<p className="text-body-sm text-grey-100">
						or click to browse
					</p>
				)}
			</div>

			<p className="text-caption text-grey-100">
				{currentCount} / {maxFiles} photos
			</p>
		</div>
	)
}

export { UploadZone }
export type { UploadZoneProps }
