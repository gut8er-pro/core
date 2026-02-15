import { useShallow } from 'zustand/react/shallow'
import { useToastStore } from '@/stores/toast-store'

function useToast() {
	return useToastStore(
		useShallow((state) => ({
			success: state.success,
			error: state.error,
			info: state.info,
			warning: state.warning,
		})),
	)
}

export { useToast }
