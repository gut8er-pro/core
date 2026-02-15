import dynamic from 'next/dynamic'
import type { RichTextEditorProps } from './rich-text-editor'

const RichTextEditor = dynamic(
	() => import('./rich-text-editor').then((m) => m.RichTextEditor),
	{
		ssr: false,
		loading: () => (
			<div className="rounded-lg border border-border">
				<div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-1">
					<div className="h-8 w-48 animate-pulse rounded bg-grey-25" />
				</div>
				<div className="min-h-[200px] animate-pulse bg-grey-25 p-4" />
			</div>
		),
	},
)

export { RichTextEditor }
export type { RichTextEditorProps }
