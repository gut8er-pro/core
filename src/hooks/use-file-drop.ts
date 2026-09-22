import { useCallback, useEffect, useRef, useState } from 'react'

type UseFileDropOptions = {
	onFiles: (files: File[]) => void
	disabled?: boolean
}

type UseFileDropReturn = {
	isDragOver: boolean
	dropHandlers: {
		onDragEnter: (event: React.DragEvent) => void
		onDragOver: (event: React.DragEvent) => void
		onDragLeave: (event: React.DragEvent) => void
		onDrop: (event: React.DragEvent) => void
	}
}

/**
 * A drag carrying OS files, as opposed to a thumbnail being dragged inside the
 * gallery. Reordering sets its own payload type, so the two drag layers can
 * share a surface without swallowing each other.
 */
function isFileDrag(event: React.DragEvent): boolean {
	return Array.from(event.dataTransfer.types).includes('Files')
}

/**
 * A file dropped outside any handler makes the browser navigate the tab to that
 * file, which tears the SPA down mid-route and surfaces as a stray screen. This
 * swallows every stray drop on the document, so only the real drop targets act.
 */
function usePageFileDropGuard(): void {
	useEffect(() => {
		function swallow(event: DragEvent) {
			if (!event.dataTransfer) return
			if (!Array.from(event.dataTransfer.types).includes('Files')) return
			event.preventDefault()
		}

		window.addEventListener('dragover', swallow)
		window.addEventListener('drop', swallow)
		return () => {
			window.removeEventListener('dragover', swallow)
			window.removeEventListener('drop', swallow)
		}
	}, [])
}

function useFileDrop({ onFiles, disabled = false }: UseFileDropOptions): UseFileDropReturn {
	const [isDragOver, setIsDragOver] = useState(false)
	// dragenter/dragleave fire for every child the cursor crosses, so the depth
	// count is what keeps the highlight from flickering over a grid of tiles.
	const depthRef = useRef(0)

	const onDragEnter = useCallback(
		(event: React.DragEvent) => {
			if (!isFileDrag(event)) return
			event.preventDefault()
			depthRef.current += 1
			if (!disabled) setIsDragOver(true)
		},
		[disabled],
	)

	const onDragOver = useCallback(
		(event: React.DragEvent) => {
			if (!isFileDrag(event)) return
			event.preventDefault()
			event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'
		},
		[disabled],
	)

	const onDragLeave = useCallback((event: React.DragEvent) => {
		if (!isFileDrag(event)) return
		event.preventDefault()
		depthRef.current = Math.max(0, depthRef.current - 1)
		if (depthRef.current === 0) setIsDragOver(false)
	}, [])

	const onDrop = useCallback(
		(event: React.DragEvent) => {
			if (!isFileDrag(event)) return
			event.preventDefault()
			event.stopPropagation()
			depthRef.current = 0
			setIsDragOver(false)

			if (disabled) return

			const files = Array.from(event.dataTransfer.files)
			if (files.length > 0) onFiles(files)
		},
		[disabled, onFiles],
	)

	return {
		isDragOver,
		dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
	}
}

export type { UseFileDropReturn }
export { useFileDrop, usePageFileDropGuard }
