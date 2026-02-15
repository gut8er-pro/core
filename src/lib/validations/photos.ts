import { z } from 'zod'

const MAX_PHOTOS_PER_REPORT = 20
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const uploadPhotoSchema = z.object({
	reportId: z.string().uuid(),
	filename: z.string().min(1),
})

const createPhotoSchema = z.object({
	url: z.string().url(),
	thumbnailUrl: z.string().url().optional(),
	previewUrl: z.string().url().optional(),
	filename: z.string().min(1),
	type: z.enum(['VEHICLE_DIAGONAL', 'DAMAGE_OVERVIEW', 'DOCUMENT', 'OTHER']).optional(),
})

const updatePhotoSchema = z.object({
	aiDescription: z.string().optional(),
	order: z.number().int().min(0).optional(),
	type: z.enum(['VEHICLE_DIAGONAL', 'DAMAGE_OVERVIEW', 'DOCUMENT', 'OTHER']).optional(),
	annotations: z.array(z.object({
		type: z.string().min(1),
		color: z.string().min(1),
		coordinates: z.record(z.string(), z.unknown()),
		fabricJson: z.record(z.string(), z.unknown()).optional(),
	})).optional(),
})

const saveAnnotationSchema = z.object({
	type: z.string().min(1),
	color: z.string().min(1),
	coordinates: z.record(z.string(), z.unknown()),
	fabricJson: z.record(z.string(), z.unknown()).optional(),
})

function validateFileType(type: string): boolean {
	return ALLOWED_TYPES.includes(type)
}

function validateFileSize(size: number): boolean {
	return size <= MAX_FILE_SIZE
}

type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>
type CreatePhotoInput = z.infer<typeof createPhotoSchema>
type UpdatePhotoInput = z.infer<typeof updatePhotoSchema>
type SaveAnnotationInput = z.infer<typeof saveAnnotationSchema>

export {
	uploadPhotoSchema,
	createPhotoSchema,
	updatePhotoSchema,
	saveAnnotationSchema,
	validateFileType,
	validateFileSize,
	MAX_PHOTOS_PER_REPORT,
	ALLOWED_TYPES,
	MAX_FILE_SIZE,
}
export type { UploadPhotoInput, CreatePhotoInput, UpdatePhotoInput, SaveAnnotationInput }
