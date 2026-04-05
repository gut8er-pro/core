'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useRef, useState } from 'react'

/** Upload cloud icon from Figma (node 4178:3347) */
function UploadCloudIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 26 26" fill="none" className={className} aria-hidden="true">
			<path
				d="M17.3 17.3L13 13L8.6 17.3"
				stroke="currentColor"
				strokeWidth="2.16"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M13 13V22.7"
				stroke="currentColor"
				strokeWidth="2.16"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M22 19.9C23.1 19.3 23.9 18.4 24.4 17.3C24.9 16.2 25 15 24.7 13.8C24.4 12.6 23.7 11.6 22.8 10.9C21.8 10.1 20.6 9.7 19.4 9.7H18.1C17.8 8.5 17.1 7.3 16.3 6.3C15.5 5.3 14.4 4.5 13.2 4C12 3.5 10.7 3.2 9.4 3.3C8.1 3.3 6.8 3.6 5.7 4.3C4.5 4.9 3.5 5.7 2.7 6.8C2 7.8 1.4 9.1 1.2 10.3C1 11.6 1 12.9 1.4 14.2C1.7 15.5 2.4 16.6 3.2 17.6"
				stroke="currentColor"
				strokeWidth="2.16"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M17.3 17.3L13 13L8.6 17.3"
				stroke="currentColor"
				strokeWidth="2.16"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

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
	const t = useTranslations('report')
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

	const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.stopPropagation()
		setIsDragOver(false)
	}, [])

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
			className={cn(
				'flex min-h-[400px] flex-col items-center justify-center rounded-card bg-white p-4',
				className,
			)}
		>
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
					'flex w-full flex-1 flex-col items-center justify-center gap-2 rounded-lg py-4 transition-colors',
					isDisabled
						? 'cursor-not-allowed opacity-60'
						: isDragOver
							? 'bg-primary-light cursor-copy'
							: 'cursor-pointer',
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

				{/* Upload icon */}
				<div className="flex h-[60px] w-[60px] items-center justify-center rounded-full border-[9px] border-primary/10 bg-primary/20">
					<UploadCloudIcon className="h-6.5 w-6.5 text-primary" />
				</div>

				<p className="text-body-sm font-semibold text-black">
					{isMaxReached ? t('gallery.maxPhotosReached') : t('gallery.dropzoneText')}
				</p>

				{!isMaxReached && <p className="text-caption text-grey-100">{t('gallery.fileTypes')}</p>}
			</div>
		</div>
	)
}

export type { UploadZoneProps }
export { UploadZone }
