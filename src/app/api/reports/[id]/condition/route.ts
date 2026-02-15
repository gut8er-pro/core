import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/api/auth'
import { conditionPatchSchema } from '@/lib/validations/condition'
import { getPaintColor } from '@/lib/design-tokens'

type RouteContext = {
	params: Promise<{ id: string }>
}

async function GET(_request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	const condition = await prisma.vehicleCondition.findUnique({
		where: { reportId: id },
		include: {
			damageMarkers: { orderBy: { id: 'asc' } },
			paintMarkers: { orderBy: { id: 'asc' } },
			tireSets: {
				orderBy: { setNumber: 'asc' },
				include: {
					tires: { orderBy: { position: 'asc' } },
				},
			},
		},
	})

	return NextResponse.json({
		condition: condition
			? {
					id: condition.id,
					reportId: condition.reportId,
					paintType: condition.paintType,
					hard: condition.hard,
					paintCondition: condition.paintCondition,
					generalCondition: condition.generalCondition,
					bodyCondition: condition.bodyCondition,
					interiorCondition: condition.interiorCondition,
					drivingAbility: condition.drivingAbility,
					specialFeatures: condition.specialFeatures,
					parkingSensors: condition.parkingSensors,
					mileageRead: condition.mileageRead,
					estimateMileage: condition.estimateMileage,
					unit: condition.unit,
					nextMot: condition.nextMot,
					fullServiceHistory: condition.fullServiceHistory,
					testDrivePerformed: condition.testDrivePerformed,
					errorMemoryRead: condition.errorMemoryRead,
					airbagsDeployed: condition.airbagsDeployed,
					notes: condition.notes,
					manualSetup: condition.manualSetup,
					previousDamageReported: condition.previousDamageReported,
					existingDamageNotReported: condition.existingDamageNotReported,
					subsequentDamage: condition.subsequentDamage,
				}
			: null,
		damageMarkers: condition?.damageMarkers ?? [],
		paintMarkers: condition?.paintMarkers ?? [],
		tireSets: condition?.tireSets ?? [],
	})
}

async function PATCH(request: NextRequest, context: RouteContext) {
	const { user, error } = await getAuthenticatedUser()
	if (error) return unauthorizedResponse()

	const { id } = await context.params

	const report = await prisma.report.findFirst({
		where: { id, userId: user!.id },
	})

	if (!report) {
		return NextResponse.json({ error: 'Report not found' }, { status: 404 })
	}

	if (report.isLocked) {
		return NextResponse.json({ error: 'Report is locked' }, { status: 403 })
	}

	const body = await request.json()
	const parsed = conditionPatchSchema.safeParse(body)

	if (!parsed.success) {
		return NextResponse.json(
			{ error: 'Invalid input', details: parsed.error.issues },
			{ status: 400 },
		)
	}

	const data = parsed.data
	const results: Record<string, unknown> = {}

	// Ensure a VehicleCondition record exists for this report
	let condition = await prisma.vehicleCondition.findUnique({
		where: { reportId: id },
	})

	if (!condition) {
		condition = await prisma.vehicleCondition.create({
			data: { reportId: id },
		})
	}

	// Update condition fields
	if (data.condition) {
		const updateData: Record<string, unknown> = {}

		if (data.condition.paintType !== undefined) updateData.paintType = data.condition.paintType
		if (data.condition.hard !== undefined) updateData.hard = data.condition.hard
		if (data.condition.paintCondition !== undefined) updateData.paintCondition = data.condition.paintCondition
		if (data.condition.generalCondition !== undefined) updateData.generalCondition = data.condition.generalCondition
		if (data.condition.bodyCondition !== undefined) updateData.bodyCondition = data.condition.bodyCondition
		if (data.condition.interiorCondition !== undefined) updateData.interiorCondition = data.condition.interiorCondition
		if (data.condition.drivingAbility !== undefined) updateData.drivingAbility = data.condition.drivingAbility
		if (data.condition.specialFeatures !== undefined) updateData.specialFeatures = data.condition.specialFeatures
		if (data.condition.parkingSensors !== undefined) updateData.parkingSensors = data.condition.parkingSensors
		if (data.condition.mileageRead !== undefined) updateData.mileageRead = data.condition.mileageRead
		if (data.condition.estimateMileage !== undefined) updateData.estimateMileage = data.condition.estimateMileage
		if (data.condition.unit !== undefined) updateData.unit = data.condition.unit
		if (data.condition.nextMot !== undefined) {
			updateData.nextMot = data.condition.nextMot ? new Date(data.condition.nextMot) : null
		}
		if (data.condition.fullServiceHistory !== undefined) updateData.fullServiceHistory = data.condition.fullServiceHistory
		if (data.condition.testDrivePerformed !== undefined) updateData.testDrivePerformed = data.condition.testDrivePerformed
		if (data.condition.errorMemoryRead !== undefined) updateData.errorMemoryRead = data.condition.errorMemoryRead
		if (data.condition.airbagsDeployed !== undefined) updateData.airbagsDeployed = data.condition.airbagsDeployed
		if (data.condition.notes !== undefined) updateData.notes = data.condition.notes
		if (data.condition.manualSetup !== undefined) updateData.manualSetup = data.condition.manualSetup
		if (data.condition.previousDamageReported !== undefined) updateData.previousDamageReported = data.condition.previousDamageReported
		if (data.condition.existingDamageNotReported !== undefined) updateData.existingDamageNotReported = data.condition.existingDamageNotReported
		if (data.condition.subsequentDamage !== undefined) updateData.subsequentDamage = data.condition.subsequentDamage

		if (Object.keys(updateData).length > 0) {
			results.condition = await prisma.vehicleCondition.update({
				where: { id: condition.id },
				data: updateData,
			})
		}
	}

	// Handle damage markers
	if (data.damageMarkers) {
		const markerResults = []
		for (const marker of data.damageMarkers) {
			const { id: markerId, ...markerData } = marker
			if (markerId) {
				const existing = await prisma.damageMarker.findFirst({
					where: { id: markerId, conditionId: condition.id },
				})
				if (existing) {
					const updated = await prisma.damageMarker.update({
						where: { id: markerId },
						data: markerData,
					})
					markerResults.push(updated)
				}
			} else {
				const created = await prisma.damageMarker.create({
					data: {
						conditionId: condition.id,
						...markerData,
					},
				})
				markerResults.push(created)
			}
		}
		results.damageMarkers = markerResults
	}

	// Delete damage markers
	if (data.deleteDamageMarkerIds && data.deleteDamageMarkerIds.length > 0) {
		await prisma.damageMarker.deleteMany({
			where: {
				id: { in: data.deleteDamageMarkerIds },
				conditionId: condition.id,
			},
		})
		results.deletedDamageMarkers = data.deleteDamageMarkerIds
	}

	// Handle paint markers
	if (data.paintMarkers) {
		const paintResults = []
		for (const marker of data.paintMarkers) {
			const { id: markerId, ...markerData } = marker
			const colorValue = markerData.color ?? getPaintColor(markerData.thickness)
			if (markerId) {
				const existing = await prisma.paintMarker.findFirst({
					where: { id: markerId, conditionId: condition.id },
				})
				if (existing) {
					const updated = await prisma.paintMarker.update({
						where: { id: markerId },
						data: { ...markerData, color: colorValue },
					})
					paintResults.push(updated)
				}
			} else {
				const created = await prisma.paintMarker.create({
					data: {
						conditionId: condition.id,
						...markerData,
						color: colorValue,
					},
				})
				paintResults.push(created)
			}
		}
		results.paintMarkers = paintResults
	}

	// Delete paint markers
	if (data.deletePaintMarkerIds && data.deletePaintMarkerIds.length > 0) {
		await prisma.paintMarker.deleteMany({
			where: {
				id: { in: data.deletePaintMarkerIds },
				conditionId: condition.id,
			},
		})
		results.deletedPaintMarkers = data.deletePaintMarkerIds
	}

	// Handle tire sets
	if (data.tireSets) {
		const tireSetResults = []
		for (const tireSet of data.tireSets) {
			const { id: tireSetId, tires, ...tireSetData } = tireSet
			if (tireSetId) {
				const existing = await prisma.tireSet.findFirst({
					where: { id: tireSetId, conditionId: condition.id },
				})
				if (existing) {
					const updated = await prisma.tireSet.update({
						where: { id: tireSetId },
						data: tireSetData,
					})

					// Update tires if provided
					if (tires) {
						for (const tire of tires) {
							const { id: tireId, ...tireData } = tire
							if (tireId) {
								await prisma.tire.update({
									where: { id: tireId },
									data: tireData,
								})
							} else {
								await prisma.tire.create({
									data: {
										tireSetId: tireSetId,
										...tireData,
									},
								})
							}
						}
					}

					const refreshed = await prisma.tireSet.findUnique({
						where: { id: tireSetId },
						include: { tires: { orderBy: { position: 'asc' } } },
					})
					tireSetResults.push(refreshed)
				}
			} else {
				const created = await prisma.tireSet.create({
					data: {
						conditionId: condition.id,
						...tireSetData,
						tires: tires
							? {
									create: tires.map((tire) => {
										const { id: _id, ...tireData } = tire
										return tireData
									}),
								}
							: undefined,
					},
					include: { tires: { orderBy: { position: 'asc' } } },
				})
				tireSetResults.push(created)
			}
		}
		results.tireSets = tireSetResults
	}

	// Delete tire sets
	if (data.deleteTireSetIds && data.deleteTireSetIds.length > 0) {
		await prisma.tireSet.deleteMany({
			where: {
				id: { in: data.deleteTireSetIds },
				conditionId: condition.id,
			},
		})
		results.deletedTireSets = data.deleteTireSetIds
	}

	// Touch the report's updatedAt timestamp
	await prisma.report.update({
		where: { id },
		data: { updatedAt: new Date() },
	})

	return NextResponse.json(results)
}

export { GET, PATCH }
