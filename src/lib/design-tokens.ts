// Design tokens exported as constants for programmatic use.
// For CSS/Tailwind usage, refer to globals.css @theme block.

export const COLORS = {
	primary: '#16A34A',
	primaryHover: '#15803D',
	primaryLight: '#F0FDF4',
	primaryLightBorder: '#BBF7D0',
	darkGreen: '#166534',
	black: '#1A1A1A',
	white: '#FFFFFF',
	grey25: '#F7F8FA',
	grey50: '#D1D5DB',
	grey100: '#6B7280',
	border: '#E5E7EB',
	borderFocus: '#16A34A',
	placeholder: '#9CA3AF',
	error: '#EF4444',
	errorLight: '#FEF2F2',
	success: '#16A34A',
	successLight: '#F0FDF4',
	warning: '#EAB308',
	warningOrange: '#F97316',
	infoBlue: '#3B82F6',
} as const

export const PAINT_THICKNESS_COLORS = {
	blue: { hex: '#49DCF2', maxMicrons: 70, label: '< 70 \u00B5m' },
	green: { hex: '#52D57B', maxMicrons: 160, label: '\u2265 70 \u00B5m' },
	yellow: { hex: '#F4CA14', maxMicrons: 300, label: '> 160 \u00B5m' },
	orange: { hex: '#F47514', maxMicrons: 700, label: '> 300 \u00B5m' },
	red: { hex: '#F41414', maxMicrons: Infinity, label: '> 700 \u00B5m' },
} as const

export function getPaintColor(thicknessMicrons: number): string {
	if (thicknessMicrons < 70) return PAINT_THICKNESS_COLORS.blue.hex
	if (thicknessMicrons <= 160) return PAINT_THICKNESS_COLORS.green.hex
	if (thicknessMicrons <= 300) return PAINT_THICKNESS_COLORS.yellow.hex
	if (thicknessMicrons <= 700) return PAINT_THICKNESS_COLORS.orange.hex
	return PAINT_THICKNESS_COLORS.red.hex
}
