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
	annotatedUrl: z.string().url().nullable().optional(),
	order: z.number().int().min(0).optional(),
	type: z.enum(['VEHICLE_DIAGONAL', 'DAMAGE_OVERVIEW', 'DOCUMENT', 'OTHER']).optional(),
	annotations: z
		.array(
			z.object({
				type: z.string().min(1),
				color: z.string().min(1),
				coordinates: z.record(z.string(), z.unknown()),
				fabricJson: z.record(z.string(), z.unknown()).optional(),
			}),
		)
		.optional(),
})

const rotatePhotoSchema = z.object({
	degrees: z.union([z.literal(90), z.literal(180), z.literal(270)]),
})

const reorderPhotosSchema = z.object({
	photoIds: z.array(z.string().uuid()).min(1).max(MAX_PHOTOS_PER_REPORT),
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
type RotatePhotoInput = z.infer<typeof rotatePhotoSchema>
type ReorderPhotosInput = z.infer<typeof reorderPhotosSchema>

export type {
	CreatePhotoInput,
	ReorderPhotosInput,
	RotatePhotoInput,
	SaveAnnotationInput,
	UpdatePhotoInput,
	UploadPhotoInput,
}
export {
	ALLOWED_TYPES,
	createPhotoSchema,
	MAX_FILE_SIZE,
	MAX_PHOTOS_PER_REPORT,
	reorderPhotosSchema,
	rotatePhotoSchema,
	saveAnnotationSchema,
	updatePhotoSchema,
	uploadPhotoSchema,
	validateFileSize,
	validateFileType,
}
