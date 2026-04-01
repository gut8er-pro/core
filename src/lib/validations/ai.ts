import { z } from 'zod'

// Request schemas
const aiPhotoRequestSchema = z.object({
	photoUrl: z.string().url('A valid photo URL is required'),
})

// Response schemas
const photoAnalysisResponseSchema = z.object({
	description: z.string(),
})

const vinDetectionResponseSchema = z.object({
	vin: z.string().nullable(),
})

const plateDetectionResponseSchema = z.object({
	plate: z.string().nullable(),
})

const ocrResponseSchema = z.record(z.string(), z.string())

type AiPhotoRequest = z.infer<typeof aiPhotoRequestSchema>
type PhotoAnalysisResponse = z.infer<typeof photoAnalysisResponseSchema>
type VinDetectionResponse = z.infer<typeof vinDetectionResponseSchema>
type PlateDetectionResponse = z.infer<typeof plateDetectionResponseSchema>
type OcrResponse = z.infer<typeof ocrResponseSchema>

export type {
	AiPhotoRequest,
	OcrResponse,
	PhotoAnalysisResponse,
	PlateDetectionResponse,
	VinDetectionResponse,
}
export {
	aiPhotoRequestSchema,
	ocrResponseSchema,
	photoAnalysisResponseSchema,
	plateDetectionResponseSchema,
	vinDetectionResponseSchema,
}
