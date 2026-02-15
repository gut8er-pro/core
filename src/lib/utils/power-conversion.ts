function kwToHp(kw: number): number {
	return Math.round(kw * 1.36)
}

function hpToKw(hp: number): number {
	return Math.round(hp / 1.36)
}

export { kwToHp, hpToKw }
