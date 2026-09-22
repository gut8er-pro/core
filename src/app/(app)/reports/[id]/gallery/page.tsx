'use client'

import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Check, X } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnnotationModal } from '@/components/report/gallery/annotation-modal.dynamic'
import { Filmstrip } from '@/components/report/gallery/filmstrip'
import { GenerateProgress } from '@/components/report/gallery/generate-progress'
import { InstructionSidebar } from '@/components/report/gallery/instruction-sidebar'
import { ClassificationBadge } from '@/components/report/gallery/photo-classification-badge'
import { PhotoGrid } from '@/components/report/gallery/photo-grid'
import { PhotoViewer } from '@/components/report/gallery/photo-viewer'
import { UploadZone } from '@/components/report/gallery/upload-zone'
import { useFileDrop, usePageFileDropGuard } from '@/hooks/use-file-drop'
import { useGenerateReport } from '@/hooks/use-generate-report'
import { usePhotoUpload } from '@/hooks/use-photo-upload'
import {
	reorderPhotos,
	useDeletePhoto,
	usePhotos,
	useReorderPhotos,
	useRotatePhoto,
} from '@/hooks/use-photos'
import type { AiGenerationSummary } from '@/hooks/use-reports'
import { useReport } from '@/hooks/use-reports'
import { useSubscriptionNotice } from '@/hooks/use-subscription-notice'
import type { PhotoClassificationType } from '@/lib/ai/types'
import { cn } from '@/lib/utils'
import { MAX_PHOTOS_PER_REPORT } from '@/lib/validations/photos'

function GalleryPage() {
	const t = useTranslations('report')
	const subscriptionNotice = useSubscriptionNotice()
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = usePhotos(reportId)
	const { data: report } = useReport(reportId)
	const deletePhoto = useDeletePhoto(reportId)
	const reorderMutation = useReorderPhotos(reportId)
	const rotateMutation = useRotatePhoto(reportId)
	const { uploadState, uploadPhotos } = usePhotoUpload(reportId)
	const _queryClient = useQueryClient()
	const { status: genStatus, generate, cancel, reset } = useGenerateReport(reportId)
	const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
	const [annotationPhotoId, setAnnotationPhotoId] = useState<string | null>(null)
	const [summaryDismissed, setSummaryDismissed] = useState(false)
	const [actionError, setActionError] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	usePageFileDropGuard()
	// Track which photo IDs were last generated to prevent duplicate runs
	const lastGeneratedPhotoIdsRef = useRef<string | null>(null)

	const photos = data?.photos ?? []
	const selectedPhoto = selectedPhotoId
		? (photos.find((p) => p.id === selectedPhotoId) ?? null)
		: null

	// Persisted AI generation summary from the report
	const persistedSummary = report?.aiGenerationSummary as AiGenerationSummary | null
	const hasGenerated = !!persistedSummary

	// After generation completes or if report was previously generated, auto-select first photo
	useEffect(() => {
		if (hasGenerated && photos.length > 0 && !selectedPhotoId) {
			setSelectedPhotoId(photos[0]?.id ?? null)
		}
	}, [hasGenerated, photos, selectedPhotoId])

	// A lapsed account gets a 402 from the generate route. The box below keeps saying
	// why; this says it once, at the moment the user asked for it.
	useEffect(() => {
		if (!genStatus.subscriptionRequired) return
		subscriptionNotice.notify()
	}, [genStatus.subscriptionRequired, subscriptionNotice])

	// Also auto-select when live generation finishes
	useEffect(() => {
		if (genStatus.summary && photos.length > 0) {
			setSelectedPhotoId(photos[0]?.id ?? null)
			// Record which photos were generated
			lastGeneratedPhotoIdsRef.current = photos
				.map((p) => p.id)
				.sort()
				.join(',')
		}
	}, [genStatus.summary, photos])

	// Listen for "Generate Report" button in the layout
	useEffect(() => {
		function handleGenerate() {
			if (photos.length === 0 || genStatus.isGenerating) return

			// Prevent re-generation if same photos haven't changed
			const currentPhotoIds = photos
				.map((p) => p.id)
				.sort()
				.join(',')
			if (lastGeneratedPhotoIdsRef.current === currentPhotoIds) {
				// Same photos already generated — skip
				return
			}

			void generate()
		}
		window.addEventListener('generate-report', handleGenerate)
		return () => window.removeEventListener('generate-report', handleGenerate)
	}, [photos, genStatus.isGenerating, generate])

	// Build classifications map: prefer live SSE data, fall back to persisted aiClassification
	const mergedClassifications = useMemo(() => {
		if (genStatus.classifications.size > 0) return genStatus.classifications
		const map = new Map<string, { type: PhotoClassificationType }>()
		for (const photo of photos) {
			if (photo.aiClassification) {
				map.set(photo.id, { type: photo.aiClassification as PhotoClassificationType })
			}
		}
		return map
	}, [genStatus.classifications, photos])

	// Effective summary: live SSE summary takes priority, then persisted DB summary
	const effectiveSummary = genStatus.summary || persistedSummary

	const isLocked = report?.isLocked ?? false

	const handleFilesSelected = useCallback(
		(files: File[]) => {
			if (isLocked) return
			void uploadPhotos(reportId, files, photos.length)
		},
		[isLocked, photos.length, reportId, uploadPhotos],
	)

	const handleReorder = useCallback(
		(fromId: string, toId: string) => {
			const next = reorderPhotos(photos, fromId, toId)
			if (next === photos) return
			setActionError(null)
			reorderMutation.mutate(
				{ photoIds: next.map((photo) => photo.id), photos: next },
				{ onError: () => setActionError(t('gallery.reorderFailed')) },
			)
		},
		[photos, reorderMutation, t],
	)

	const handleRotate = useCallback(
		(photoId: string) => {
			const photo = photos.find((p) => p.id === photoId)
			if (!photo) return

			// The markings were drawn against the old orientation; v1 drops them
			// rather than rotating the fabric JSON, so the assessor gets a say.
			const hasAnnotations = photo.annotations.length > 0 || !!photo.annotatedUrl
			if (hasAnnotations && !window.confirm(t('gallery.rotateClearsAnnotations'))) return

			setActionError(null)
			rotateMutation.mutate(
				{ photoId, degrees: 90 },
				{ onError: () => setActionError(t('gallery.rotateFailed')) },
			)
		},
		[photos, rotateMutation, t],
	)

	const handleAddPhotos = useCallback(() => {
		if (isLocked) return
		fileInputRef.current?.click()
	}, [isLocked])

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files
			if (!files || files.length === 0) return
			handleFilesSelected(Array.from(files))
			e.target.value = ''
		},
		[handleFilesSelected],
	)

	const handleDelete = useCallback(
		(photoId: string) => {
			if (isLocked) return
			deletePhoto.mutate(photoId)
			if (selectedPhotoId === photoId) {
				setSelectedPhotoId(null)
			}
		},
		[deletePhoto, isLocked, selectedPhotoId],
	)

	const handleAnnotate = useCallback((photoId: string) => {
		setAnnotationPhotoId(photoId)
	}, [])

	const uploadErrors = useMemo(
		() => (uploadState.error ? uploadState.error.split('\n') : []),
		[uploadState.error],
	)

	// The single-photo view has no dropzone of its own, so without this a file
	// dropped here reaches the document and navigates the tab away.
	const singleViewDrop = useFileDrop({
		onFiles: handleFilesSelected,
		disabled: isLocked || uploadState.isUploading || photos.length >= MAX_PHOTOS_PER_REPORT,
	})

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	// Determine view: empty → upload, photos + no selection → grid, photos + selection → single
	const hasPhotos = photos.length > 0
	const showSingleView = hasPhotos && selectedPhoto !== null

	return (
		<div className="flex flex-col gap-4 xl:flex-row xl:gap-6">
			{/* Hidden file input for adding photos via filmstrip "+" button */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/jpeg,image/png"
				multiple
				onChange={handleFileInputChange}
				className="hidden"
			/>

			{/* Left sidebar: only show instruction sidebar during upload/grid phase (before generation).
			    After generation, the layout renders the report nav sidebar. */}
			{!hasGenerated && !showSingleView && (
				<InstructionSidebar
					className="hidden w-75.5 shrink-0 xl:block"
					classifications={
						mergedClassifications as Map<string, import('@/lib/ai/types').ClassificationResult>
					}
					generationSummary={effectiveSummary ?? undefined}
				/>
			)}

			{/* Main content area */}
			<div className="flex flex-1 flex-col gap-6 min-w-0">
				{/* Generation progress */}
				{genStatus.isGenerating && <GenerateProgress status={genStatus} onCancel={cancel} />}

				{/* Generation error */}
				{genStatus.error && (
					<div className="flex items-center gap-2 rounded-lg border border-error bg-error-light px-4 py-3">
						<AlertCircle className="h-4 w-4 shrink-0 text-error" />
						<p className="flex-1 text-body-sm text-error">
							{genStatus.subscriptionRequired ? subscriptionNotice.message : genStatus.error}
						</p>
						<button
							type="button"
							onClick={reset}
							className="shrink-0 cursor-pointer text-error hover:text-error/80"
							aria-label="Dismiss error"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				)}

				{/* Generation summary */}
				{effectiveSummary && !genStatus.isGenerating && !genStatus.error && !summaryDismissed && (
					<div className="flex items-center gap-2 rounded-lg border border-primary bg-primary-light px-4 py-3">
						<Check className="h-4 w-4 shrink-0 text-primary" />
						<p className="flex-1 text-body-sm text-primary">
							{t('gallery.reportGenerated', { count: effectiveSummary.totalFieldsFilled })}
							{effectiveSummary.damageMarkersPlaced > 0 &&
								`, ${t('gallery.damageMarkersPlaced', { count: effectiveSummary.damageMarkersPlaced })}`}
						</p>
						<button
							type="button"
							onClick={() => {
								setSummaryDismissed(true)
								reset()
							}}
							className="shrink-0 cursor-pointer text-primary hover:text-primary/80"
							aria-label="Dismiss message"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				)}

				{/* Upload progress */}
				{uploadState.isUploading && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between text-body-sm">
							<span className="text-grey-100">{t('gallery.uploadPhotos')}...</span>
							<span className="font-semibold text-primary">{uploadState.progress}%</span>
						</div>
						<div className="h-2 overflow-hidden rounded-full bg-grey-25">
							<div
								className="h-full rounded-full bg-primary transition-all"
								style={{ width: `${uploadState.progress}%` }}
							/>
						</div>
					</div>
				)}

				{/* Upload result — every skipped file is named, never silence */}
				{!uploadState.isUploading && uploadState.summary && (
					<div
						data-testid="upload-summary"
						className={cn(
							'rounded-lg border px-4 py-2 text-body-sm',
							uploadErrors.length > 0
								? 'border-error bg-error-light text-error'
								: 'border-primary bg-primary-light text-primary',
						)}
					>
						<p className="font-semibold">{uploadState.summary}</p>
						{uploadErrors.map((message) => (
							<p key={message}>{message}</p>
						))}
					</div>
				)}

				{actionError && (
					<div className="rounded-lg border border-error bg-error-light px-4 py-2 text-body-sm text-error">
						{actionError}
					</div>
				)}

				{isLocked && (
					<div className="rounded-lg border border-warning-border bg-warning-border/10 px-4 py-2 text-body-sm text-warning-dark">
						{t('gallery.lockedHint')}
					</div>
				)}

				{/* Gallery content — 3 views */}
				{!hasPhotos ? (
					/* Empty state: upload zone */
					<UploadZone
						onFilesSelected={handleFilesSelected}
						currentCount={photos.length}
						maxFiles={MAX_PHOTOS_PER_REPORT}
						disabled={uploadState.isUploading || isLocked}
					/>
				) : showSingleView ? (
					/* Single photo view with filmstrip */
					<div
						{...singleViewDrop.dropHandlers}
						data-gallery-drop=""
						className={cn(
							'flex flex-col gap-6 rounded-card transition-colors',
							singleViewDrop.isDragOver && !isLocked && 'outline-2 outline-dashed outline-primary',
						)}
					>
						<div className="relative">
							<PhotoViewer
								photo={selectedPhoto}
								locked={isLocked}
								isRotating={rotateMutation.isPending}
								onRotate={() => selectedPhoto && handleRotate(selectedPhoto.id)}
								onDelete={() => selectedPhoto && handleDelete(selectedPhoto.id)}
								onAnnotate={() => selectedPhoto && handleAnnotate(selectedPhoto.id)}
							/>
							{/* Classification badge overlay */}
							{selectedPhoto &&
								(() => {
									const liveClassification = genStatus.classifications.get(selectedPhoto.id)?.type
									const persistedClassification =
										selectedPhoto.aiClassification as PhotoClassificationType | null
									const classification = liveClassification || persistedClassification
									if (!classification) return null
									return (
										<div className="absolute left-3 top-3">
											<ClassificationBadge classification={classification} />
										</div>
									)
								})()}
						</div>

						<Filmstrip
							photos={photos}
							selectedId={selectedPhoto?.id}
							onSelect={setSelectedPhotoId}
							onAdd={handleAddPhotos}
							onReorder={handleReorder}
							locked={isLocked}
							maxPhotos={MAX_PHOTOS_PER_REPORT}
						/>
					</div>
				) : (
					/* Grid view */
					<PhotoGrid
						photos={photos}
						onSelect={(id) => setSelectedPhotoId(id)}
						onEdit={handleAnnotate}
						onDelete={handleDelete}
						onAdd={handleAddPhotos}
						onFilesDropped={handleFilesSelected}
						onReorder={handleReorder}
						locked={isLocked}
						maxPhotos={MAX_PHOTOS_PER_REPORT}
					/>
				)}

				{/* Back to grid button — shown in single view */}
				{showSingleView && (
					<button
						type="button"
						onClick={() => setSelectedPhotoId(null)}
						className="self-start text-body-sm font-medium text-primary hover:underline"
					>
						{t('gallery.backToGallery')}
					</button>
				)}
			</div>

			{/* Annotation modal */}
			<AnnotationModal
				photo={photos.find((p) => p.id === annotationPhotoId) ?? null}
				photos={photos}
				reportId={reportId}
				locked={isLocked}
				open={annotationPhotoId !== null}
				onClose={() => setAnnotationPhotoId(null)}
				onNavigate={setAnnotationPhotoId}
			/>
		</div>
	)
}

export default GalleryPage
