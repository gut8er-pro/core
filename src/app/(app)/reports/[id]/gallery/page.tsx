'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
	Grid,
	Image as ImageIcon,
	Sparkles,
	ScanLine,
	CarFront,
	FileText,
	Copy,
	Check,
	AlertCircle,
	X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePhotos, useDeletePhoto } from '@/hooks/use-photos'
import { usePhotoUpload } from '@/hooks/use-photo-upload'
import {
	usePhotoAnalysis,
	useVinDetection,
	usePlateDetection,
	useDocumentOcr,
} from '@/hooks/use-ai'

import { MAX_PHOTOS_PER_REPORT } from '@/lib/validations/photos'
import { UploadZone } from '@/components/report/gallery/upload-zone'
import { PhotoGrid } from '@/components/report/gallery/photo-grid'
import { PhotoViewer } from '@/components/report/gallery/photo-viewer'
import { Filmstrip } from '@/components/report/gallery/filmstrip'
import { InstructionSidebar } from '@/components/report/gallery/instruction-sidebar'
import { AnnotationModal } from '@/components/report/gallery/annotation-modal.dynamic'
import type { OcrResult } from '@/lib/ai/client'

type ViewMode = 'single' | 'grid'

type AiResultState = {
	type: 'analyze' | 'vin' | 'plate' | 'ocr' | null
	data: unknown
}

function GalleryPage() {
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = usePhotos(reportId)
	const deletePhoto = useDeletePhoto(reportId)
	const { uploadState, uploadPhotos } = usePhotoUpload(reportId)
	const [viewMode, setViewMode] = useState<ViewMode>('single')
	const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
	const [annotationPhotoId, setAnnotationPhotoId] = useState<string | null>(null)
	const [aiResult, setAiResult] = useState<AiResultState>({ type: null, data: null })
	const [aiError, setAiError] = useState<string | null>(null)
	const [copySuccess, setCopySuccess] = useState<string | null>(null)

	const analysisMutation = usePhotoAnalysis()
	const vinMutation = useVinDetection()
	const plateMutation = usePlateDetection()
	const ocrMutation = useDocumentOcr()

	const photos = data?.photos ?? []
	const selectedPhoto = photos.find((p) => p.id === selectedPhotoId) ?? photos[0] ?? null

	const isAnyAiLoading =
		analysisMutation.isPending ||
		vinMutation.isPending ||
		plateMutation.isPending ||
		ocrMutation.isPending

	const handleFilesSelected = useCallback(
		(files: File[]) => {
			void uploadPhotos(reportId, files)
		},
		[reportId, uploadPhotos],
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

	const handleAiError = useCallback((err: Error) => {
		setAiError(err.message)
	}, [])

	const clearAiState = useCallback(() => {
		setAiResult({ type: null, data: null })
		setAiError(null)
		setCopySuccess(null)
	}, [])

	// Use the AI-optimized variant when available, falling back to the original URL
	const getAiPhotoUrl = useCallback((photo: typeof selectedPhoto) => {
		return photo?.aiUrl || photo?.url || ''
	}, [])

	const handleAnalyze = useCallback(() => {
		if (!selectedPhoto) return
		clearAiState()
		analysisMutation.mutate(getAiPhotoUrl(selectedPhoto), {
			onSuccess: (result) => {
				setAiResult({ type: 'analyze', data: result })
			},
			onError: handleAiError,
		})
	}, [selectedPhoto, analysisMutation, clearAiState, handleAiError, getAiPhotoUrl])

	const handleDetectVin = useCallback(() => {
		if (!selectedPhoto) return
		clearAiState()
		vinMutation.mutate(getAiPhotoUrl(selectedPhoto), {
			onSuccess: (result) => {
				setAiResult({ type: 'vin', data: result })
			},
			onError: handleAiError,
		})
	}, [selectedPhoto, vinMutation, clearAiState, handleAiError, getAiPhotoUrl])

	const handleDetectPlate = useCallback(() => {
		if (!selectedPhoto) return
		clearAiState()
		plateMutation.mutate(getAiPhotoUrl(selectedPhoto), {
			onSuccess: (result) => {
				setAiResult({ type: 'plate', data: result })
			},
			onError: handleAiError,
		})
	}, [selectedPhoto, plateMutation, clearAiState, handleAiError, getAiPhotoUrl])

	const handleScanDocument = useCallback(() => {
		if (!selectedPhoto) return
		clearAiState()
		ocrMutation.mutate(getAiPhotoUrl(selectedPhoto), {
			onSuccess: (result) => {
				setAiResult({ type: 'ocr', data: result })
			},
			onError: handleAiError,
		})
	}, [selectedPhoto, ocrMutation, clearAiState, handleAiError, getAiPhotoUrl])

	const handleCopyToVehicle = useCallback(
		async (vin: string) => {
			try {
				const response = await fetch(`/api/reports/${reportId}/vehicle`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ vin }),
				})
				if (!response.ok) {
					throw new Error('Failed to update vehicle info')
				}
				setCopySuccess('VIN copied to Vehicle section')
			} catch {
				setAiError('Failed to copy VIN to vehicle. Please try again.')
			}
		},
		[reportId],
	)

	const handleCopyToClaimant = useCallback(
		async (licensePlate: string) => {
			try {
				const response = await fetch(`/api/reports/${reportId}/accident-info`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						claimantInfo: { licensePlate },
					}),
				})
				if (!response.ok) {
					throw new Error('Failed to update claimant info')
				}
				setCopySuccess('License plate copied to Claimant section')
			} catch {
				setAiError('Failed to copy plate to claimant. Please try again.')
			}
		},
		[reportId],
	)

	const handleApplyOcrToVehicle = useCallback(
		async (ocrData: OcrResult) => {
			try {
				const vehiclePayload: Record<string, unknown> = {}

				if (ocrData.manufacturer) {
					vehiclePayload.manufacturer = ocrData.manufacturer
				}
				if (ocrData.vin) {
					vehiclePayload.vin = ocrData.vin
				}
				if (ocrData.firstRegistration) {
					vehiclePayload.firstRegistration = ocrData.firstRegistration
				}
				if (ocrData.engineDisplacement) {
					const displacement = Number.parseInt(ocrData.engineDisplacement, 10)
					if (!Number.isNaN(displacement)) {
						vehiclePayload.displacement = displacement
					}
				}
				if (ocrData.power) {
					const powerKw = Number.parseInt(ocrData.power, 10)
					if (!Number.isNaN(powerKw)) {
						vehiclePayload.powerKw = powerKw
					}
				}
				if (ocrData.fuel) {
					vehiclePayload.motorType = ocrData.fuel
				}

				const response = await fetch(`/api/reports/${reportId}/vehicle`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(vehiclePayload),
				})
				if (!response.ok) {
					throw new Error('Failed to update vehicle info')
				}

				// Also copy the license plate to claimant info if present
				if (ocrData.licensePlate) {
					await fetch(`/api/reports/${reportId}/accident-info`, {
						method: 'PATCH',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							claimantInfo: { licensePlate: ocrData.licensePlate },
						}),
					})
				}

				setCopySuccess('Document data applied to Vehicle and Claimant sections')
			} catch {
				setAiError('Failed to apply document data. Please try again.')
			}
		},
		[reportId],
	)

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	return (
		<div className="flex gap-6">
			{/* Left instruction sidebar */}
			<InstructionSidebar className="hidden w-[220px] shrink-0 xl:block" />

			{/* Main content area */}
			<div className="flex flex-1 flex-col gap-6 min-w-0">
				{/* Header bar */}
				<div className="flex items-center justify-between">
					<h1 className="text-h3 font-semibold text-black">Gallery</h1>
					<div className="flex items-center gap-2">
						<Button
							variant={viewMode === 'single' ? 'secondary' : 'ghost'}
							size="icon"
							onClick={() => setViewMode('single')}
							aria-label="Single view"
						>
							<ImageIcon className="h-5 w-5" />
						</Button>
						<Button
							variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
							size="icon"
							onClick={() => setViewMode('grid')}
							aria-label="Grid view"
						>
							<Grid className="h-5 w-5" />
						</Button>
					</div>
				</div>

				{/* Upload zone */}
				<UploadZone
					onFilesSelected={handleFilesSelected}
					currentCount={photos.length}
					maxFiles={MAX_PHOTOS_PER_REPORT}
					disabled={uploadState.isUploading}
				/>

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
				{viewMode === 'single' ? (
					<div className="flex flex-col gap-6">
						<PhotoViewer
							photo={selectedPhoto}
							onEdit={() => selectedPhoto && handleAnnotate(selectedPhoto.id)}
							onDelete={() => selectedPhoto && handleDelete(selectedPhoto.id)}
							onAnnotate={() => selectedPhoto && handleAnnotate(selectedPhoto.id)}
						/>

						{/* AI Toolbar — only shown in single view when a photo is selected */}
						{selectedPhoto && (
							<AiToolbar
								isAnyLoading={isAnyAiLoading}
								analysisPending={analysisMutation.isPending}
								vinPending={vinMutation.isPending}
								platePending={plateMutation.isPending}
								ocrPending={ocrMutation.isPending}
								onAnalyze={handleAnalyze}
								onDetectVin={handleDetectVin}
								onDetectPlate={handleDetectPlate}
								onScanDocument={handleScanDocument}
								aiResult={aiResult}
								aiError={aiError}
								copySuccess={copySuccess}
								onCopyToVehicle={handleCopyToVehicle}
								onCopyToClaimant={handleCopyToClaimant}
								onApplyOcr={handleApplyOcrToVehicle}
								onDismiss={clearAiState}
							/>
						)}

						<Filmstrip
							photos={photos}
							selectedId={selectedPhoto?.id}
							onSelect={setSelectedPhotoId}
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
				open={annotationPhotoId !== null}
				onClose={() => setAnnotationPhotoId(null)}
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

// --- AI Toolbar sub-component ---

type AiToolbarProps = {
	isAnyLoading: boolean
	analysisPending: boolean
	vinPending: boolean
	platePending: boolean
	ocrPending: boolean
	onAnalyze: () => void
	onDetectVin: () => void
	onDetectPlate: () => void
	onScanDocument: () => void
	aiResult: AiResultState
	aiError: string | null
	copySuccess: string | null
	onCopyToVehicle: (vin: string) => void
	onCopyToClaimant: (plate: string) => void
	onApplyOcr: (data: OcrResult) => void
	onDismiss: () => void
}

function AiToolbar({
	isAnyLoading,
	analysisPending,
	vinPending,
	platePending,
	ocrPending,
	onAnalyze,
	onDetectVin,
	onDetectPlate,
	onScanDocument,
	aiResult,
	aiError,
	copySuccess,
	onCopyToVehicle,
	onCopyToClaimant,
	onApplyOcr,
	onDismiss,
}: AiToolbarProps) {
	return (
		<div className="flex flex-col gap-3">
			{/* AI action buttons bar */}
			<div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-grey-25 p-3">
				<div className="flex items-center gap-1.5 mr-2">
					<Sparkles className="h-4 w-4 text-primary" />
					<span className="text-body-sm font-semibold text-black">AI Tools</span>
				</div>

				<Button
					variant="outline"
					size="sm"
					icon={<Sparkles className="h-4 w-4" />}
					loading={analysisPending}
					disabled={isAnyLoading}
					onClick={onAnalyze}
				>
					Analyze Damage
				</Button>

				<Button
					variant="outline"
					size="sm"
					icon={<ScanLine className="h-4 w-4" />}
					loading={vinPending}
					disabled={isAnyLoading}
					onClick={onDetectVin}
				>
					Detect VIN
				</Button>

				<Button
					variant="outline"
					size="sm"
					icon={<CarFront className="h-4 w-4" />}
					loading={platePending}
					disabled={isAnyLoading}
					onClick={onDetectPlate}
				>
					Detect Plate
				</Button>

				<Button
					variant="outline"
					size="sm"
					icon={<FileText className="h-4 w-4" />}
					loading={ocrPending}
					disabled={isAnyLoading}
					onClick={onScanDocument}
				>
					Scan Document
				</Button>
			</div>

			{/* AI error message */}
			{aiError && (
				<div className="flex items-center gap-2 rounded-lg border border-error bg-error-light px-4 py-3">
					<AlertCircle className="h-4 w-4 shrink-0 text-error" />
					<p className="flex-1 text-body-sm text-error">{aiError}</p>
					<button
						type="button"
						onClick={onDismiss}
						className="shrink-0 cursor-pointer text-error hover:text-error/80"
						aria-label="Dismiss error"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			)}

			{/* Copy success message */}
			{copySuccess && (
				<div className="flex items-center gap-2 rounded-lg border border-primary bg-primary-light px-4 py-3">
					<Check className="h-4 w-4 shrink-0 text-primary" />
					<p className="flex-1 text-body-sm text-primary">{copySuccess}</p>
					<button
						type="button"
						onClick={onDismiss}
						className="shrink-0 cursor-pointer text-primary hover:text-primary/80"
						aria-label="Dismiss message"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			)}

			{/* AI result cards */}
			{aiResult.type === 'analyze' && (
				<AiAnalyzeResultCard
					data={aiResult.data as { description: string }}
					onDismiss={onDismiss}
				/>
			)}

			{aiResult.type === 'vin' && (
				<AiVinResultCard
					data={aiResult.data as { vin: string | null }}
					onCopyToVehicle={onCopyToVehicle}
					onDismiss={onDismiss}
				/>
			)}

			{aiResult.type === 'plate' && (
				<AiPlateResultCard
					data={aiResult.data as { plate: string | null }}
					onCopyToClaimant={onCopyToClaimant}
					onDismiss={onDismiss}
				/>
			)}

			{aiResult.type === 'ocr' && (
				<AiOcrResultCard
					data={aiResult.data as OcrResult}
					onApply={onApplyOcr}
					onDismiss={onDismiss}
				/>
			)}
		</div>
	)
}

// --- AI Result Card sub-components ---

function AiAnalyzeResultCard({
	data,
	onDismiss,
}: {
	data: { description: string }
	onDismiss: () => void
}) {
	return (
		<Card padding="md">
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<Sparkles className="h-4 w-4 text-primary" />
						<span className="text-body-sm font-semibold text-black">
							Damage Analysis
						</span>
					</div>
					<button
						type="button"
						onClick={onDismiss}
						className="cursor-pointer text-grey-100 hover:text-black"
						aria-label="Dismiss result"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<p className="whitespace-pre-wrap text-body-sm text-grey-100">
					{data.description}
				</p>
			</div>
		</Card>
	)
}

function AiVinResultCard({
	data,
	onCopyToVehicle,
	onDismiss,
}: {
	data: { vin: string | null }
	onCopyToVehicle: (vin: string) => void
	onDismiss: () => void
}) {
	if (!data.vin) {
		return (
			<Card padding="md">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<ScanLine className="h-4 w-4 text-grey-100" />
						<span className="text-body-sm text-grey-100">
							No VIN could be detected in this photo. Try a clearer image of the VIN plate.
						</span>
					</div>
					<button
						type="button"
						onClick={onDismiss}
						className="shrink-0 cursor-pointer text-grey-100 hover:text-black"
						aria-label="Dismiss result"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			</Card>
		)
	}

	return (
		<Card padding="md">
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<ScanLine className="h-4 w-4 text-primary" />
						<span className="text-body-sm font-semibold text-black">
							VIN Detected
						</span>
					</div>
					<button
						type="button"
						onClick={onDismiss}
						className="cursor-pointer text-grey-100 hover:text-black"
						aria-label="Dismiss result"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<div className="flex items-center gap-3">
					<code className="rounded bg-grey-25 px-3 py-1.5 font-mono text-body-sm text-black">
						{data.vin}
					</code>
					<Button
						variant="primary"
						size="sm"
						icon={<Copy className="h-3.5 w-3.5" />}
						onClick={() => onCopyToVehicle(data.vin!)}
					>
						Copy to Vehicle
					</Button>
				</div>
			</div>
		</Card>
	)
}

function AiPlateResultCard({
	data,
	onCopyToClaimant,
	onDismiss,
}: {
	data: { plate: string | null }
	onCopyToClaimant: (plate: string) => void
	onDismiss: () => void
}) {
	if (!data.plate) {
		return (
			<Card padding="md">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CarFront className="h-4 w-4 text-grey-100" />
						<span className="text-body-sm text-grey-100">
							No license plate could be detected in this photo. Try a clearer image.
						</span>
					</div>
					<button
						type="button"
						onClick={onDismiss}
						className="shrink-0 cursor-pointer text-grey-100 hover:text-black"
						aria-label="Dismiss result"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			</Card>
		)
	}

	return (
		<Card padding="md">
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<CarFront className="h-4 w-4 text-primary" />
						<span className="text-body-sm font-semibold text-black">
							License Plate Detected
						</span>
					</div>
					<button
						type="button"
						onClick={onDismiss}
						className="cursor-pointer text-grey-100 hover:text-black"
						aria-label="Dismiss result"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<div className="flex items-center gap-3">
					<code className="rounded bg-grey-25 px-3 py-1.5 font-mono text-body-sm text-black">
						{data.plate}
					</code>
					<Button
						variant="primary"
						size="sm"
						icon={<Copy className="h-3.5 w-3.5" />}
						onClick={() => onCopyToClaimant(data.plate!)}
					>
						Copy to Claimant
					</Button>
				</div>
			</div>
		</Card>
	)
}

function AiOcrResultCard({
	data,
	onApply,
	onDismiss,
}: {
	data: OcrResult
	onApply: (data: OcrResult) => void
	onDismiss: () => void
}) {
	const fields = Object.entries(data).filter(([, value]) => value && value.length > 0)

	if (fields.length === 0) {
		return (
			<Card padding="md">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<FileText className="h-4 w-4 text-grey-100" />
						<span className="text-body-sm text-grey-100">
							No data could be extracted from this document. Try a clearer image.
						</span>
					</div>
					<button
						type="button"
						onClick={onDismiss}
						className="shrink-0 cursor-pointer text-grey-100 hover:text-black"
						aria-label="Dismiss result"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			</Card>
		)
	}

	const fieldLabels: Record<string, string> = {
		manufacturer: 'Manufacturer',
		model: 'Model',
		vin: 'VIN',
		licensePlate: 'License Plate',
		firstRegistration: 'First Registration',
		engineDisplacement: 'Engine Displacement',
		power: 'Power (kW)',
		fuel: 'Fuel Type',
		mileage: 'Mileage',
	}

	return (
		<Card padding="md">
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-1.5">
						<FileText className="h-4 w-4 text-primary" />
						<span className="text-body-sm font-semibold text-black">
							Document Data Extracted
						</span>
					</div>
					<button
						type="button"
						onClick={onDismiss}
						className="cursor-pointer text-grey-100 hover:text-black"
						aria-label="Dismiss result"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				<div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
					{fields.map(([key, value]) => (
						<div key={key} className="flex items-baseline gap-2">
							<span className="text-caption font-semibold text-grey-100">
								{fieldLabels[key] ?? key}:
							</span>
							<span className="text-body-sm text-black">{value}</span>
						</div>
					))}
				</div>

				<Button
					variant="primary"
					size="sm"
					icon={<Copy className="h-3.5 w-3.5" />}
					onClick={() => onApply(data)}
					className="self-start"
				>
					Apply to Vehicle
				</Button>
			</div>
		</Card>
	)
}

export default GalleryPage
