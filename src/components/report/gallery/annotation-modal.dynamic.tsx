import dynamic from 'next/dynamic'
import type { AnnotationModalProps } from './annotation-modal'

const AnnotationModal = dynamic(
	() => import('./annotation-modal').then((m) => m.AnnotationModal),
	{
		ssr: false,
		loading: () => null,
	},
)

export { AnnotationModal }
export type { AnnotationModalProps }
