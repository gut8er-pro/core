'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
	Sparkles,
	AlertCircle,
	X,
	Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePhotos, useDeletePhoto } from '@/hooks/use-photos'
import { usePhotoUpload } from '@/hooks/use-photo-upload'
import { useGenerateReport } from '@/hooks/use-generate-report'
import { useReport } from '@/hooks/use-reports'
import type { AiGenerationSummary } from '@/hooks/use-reports'

import { MAX_PHOTOS_PER_REPORT } from '@/lib/validations/photos'
import { UploadZone } from '@/components/report/gallery/upload-zone'
import { PhotoGrid } from '@/components/report/gallery/photo-grid'
import { PhotoViewer } from '@/components/report/gallery/photo-viewer'
import { Filmstrip } from '@/components/report/gallery/filmstrip'
import { InstructionSidebar } from '@/components/report/gallery/instruction-sidebar'
import { AnnotationModal } from '@/components/report/gallery/annotation-modal.dynamic'
import { GenerateProgress } from '@/components/report/gallery/generate-progress'
import { ClassificationBadge } from '@/components/report/gallery/photo-classification-badge'
import type { PhotoClassificationType } from '@/lib/ai/types'

type ViewMode = 'single' | 'grid'

function GalleryPage() {
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = usePhotos(reportId)
	const { data: report } = useReport(reportId)
	const deletePhoto = useDeletePhoto(reportId)
	const { uploadState, uploadPhotos } = usePhotoUpload(reportId)
	const { status: genStatus, generate, cancel, reset } = useGenerateReport(reportId)
	const [viewMode] = useState<ViewMode>('single')
	const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
	const [annotationPhotoId, setAnnotationPhotoId] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const photos = data?.photos ?? []
	const selectedPhoto = photos.find((p) => p.id === selectedPhotoId) ?? photos[0] ?? null

	// Persisted AI generation summary from the report
	const persistedSummary = report?.aiGenerationSummary as AiGenerationSummary | null

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
	const hasLiveSummary = !!genStatus.summary

	const handleFilesSelected = useCallback(
		(files: File[]) => {
			void uploadPhotos(reportId, files)
		},
		[reportId, uploadPhotos],
	)

	const handleAddPhotos = useCallback(() => {
		fileInputRef.current?.click()
	}, [])

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files
			if (!files || files.length === 0) return
			handleFilesSelected(Array.from(files))
			// Reset input so the same files can be selected again
			e.target.value = ''
		},
		[handleFilesSelected],
	)

	const handleDelete = useCallback(
		(photoId: string) => {
			deletePhoto.mutate(photoId)
			if (selectedPhotoId === photoId) {
				setSelectedPhotoId(null)
			}
		},
		[deletePhoto, selectedPhotoId],
	)

	const handleAnnotate = useCallback(
		(photoId: string) => {
			setAnnotationPhotoId(photoId)
		},
		[],
	)

	const handleGenerate = useCallback(() => {
		void generate()
	}, [generate])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	return (
		<div className="flex gap-6">
			{/* Hidden file input for adding photos via filmstrip "+" button */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/jpeg,image/png"
				multiple
				onChange={handleFileInputChange}
				className="hidden"
				aria-hidden="true"
			/>

			{/* Left instruction sidebar */}
			<InstructionSidebar
				className="hidden w-72 shrink-0 xl:block"
				classifications={mergedClassifications as Map<string, import('@/lib/ai/types').ClassificationResult>}
				generationSummary={effectiveSummary ?? undefined}
			/>

			{/* Main content area */}
			<div className="flex flex-1 flex-col gap-6 min-w-0">
				{/* Header bar */}
				<div className="flex items-center justify-end">
					<Button
						variant="primary"
						icon={<Sparkles className="h-4 w-4" />}
						onClick={handleGenerate}
						disabled={photos.length === 0 || genStatus.isGenerating}
						loading={genStatus.isGenerating}
					>
						Generate Report
					</Button>
				</div>

				{/* Generation progress */}
				{genStatus.isGenerating && (
					<GenerateProgress status={genStatus} onCancel={cancel} />
				)}

				{/* Generation error */}
				{genStatus.error && (
					<div className="flex items-center gap-2 rounded-lg border border-error bg-error-light px-4 py-3">
						<AlertCircle className="h-4 w-4 shrink-0 text-error" />
						<p className="flex-1 text-body-sm text-error">{genStatus.error}</p>
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

				{/* Generation summary — live after generation or persisted from DB */}
				{effectiveSummary && !genStatus.isGenerating && !genStatus.error && (
					<div className="flex items-center gap-2 rounded-lg border border-primary bg-primary-light px-4 py-3">
						<Check className="h-4 w-4 shrink-0 text-primary" />
						<p className="flex-1 text-body-sm text-primary">
							Report generated — {effectiveSummary.totalFieldsFilled} fields auto-filled
							{effectiveSummary.damageMarkersPlaced > 0 && `, ${effectiveSummary.damageMarkersPlaced} damage markers placed`}
						</p>
						{hasLiveSummary && (
							<button
								type="button"
								onClick={reset}
								className="shrink-0 cursor-pointer text-primary hover:text-primary/80"
								aria-label="Dismiss message"
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>
				)}

				{/* Upload progress */}
				{uploadState.isUploading && (
					<div className="flex flex-col gap-1">
						<div className="flex items-center justify-between text-body-sm">
							<span className="text-grey-100">Uploading photos...</span>
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

				{/* Upload errors */}
				{uploadState.error && (
					<div className="rounded-lg border border-error bg-error-light px-4 py-2 text-body-sm text-error">
						{uploadState.error}
					</div>
				)}

				{/* Gallery content */}
				{photos.length === 0 ? (
					/* Upload zone - only shown when no photos */
					<UploadZone
						onFilesSelected={handleFilesSelected}
						currentCount={photos.length}
						maxFiles={MAX_PHOTOS_PER_REPORT}
						disabled={uploadState.isUploading}
					/>
				) : viewMode === 'single' ? (
					<div className="flex flex-col gap-6">
						<div className="relative">
							<PhotoViewer
								photo={selectedPhoto}
								onDelete={() => selectedPhoto && handleDelete(selectedPhoto.id)}
								onAnnotate={() => selectedPhoto && handleAnnotate(selectedPhoto.id)}
							/>
							{/* Classification badge overlay — live during generation, persisted after */}
							{selectedPhoto && (() => {
								const liveClassification = genStatus.classifications.get(selectedPhoto.id)?.type
								const persistedClassification = selectedPhoto.aiClassification as PhotoClassificationType | null
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
						/>
					</div>
				) : (
					<PhotoGrid
						photos={photos}
						selectedId={selectedPhoto?.id}
						onSelect={setSelectedPhotoId}
						onEdit={handleAnnotate}
						onDelete={handleDelete}
					/>
				)}
			</div>

			{/* Annotation modal */}
			<AnnotationModal
				photo={photos.find((p) => p.id === annotationPhotoId) ?? null}
				photos={photos}
				open={annotationPhotoId !== null}
				onClose={() => setAnnotationPhotoId(null)}
				onNavigate={setAnnotationPhotoId}
				onSave={async (fabricJson) => {
					if (!annotationPhotoId) return
					try {
						await fetch(`/api/reports/${reportId}/photos/${annotationPhotoId}`, {
							method: 'PATCH',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								annotations: [{
									type: 'fabric',
									color: '#ff0000',
									coordinates: {},
									fabricJson,
								}],
							}),
						})
						setAnnotationPhotoId(null)
					} catch {
						// Annotation save failed silently -- photo still accessible
					}
				}}
			/>
		</div>
	)
}

export default GalleryPage
