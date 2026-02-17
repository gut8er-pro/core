'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useAccidentInfo, useSaveSignature } from '@/hooks/use-accident-info'
import { useReport } from '@/hooks/use-reports'
import { useAutoSave } from '@/hooks/use-auto-save'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { SignaturePad } from '@/components/signature/signature-pad.dynamic'
import { AccidentSection } from '@/components/report/accident-info/accident-section'
import { ClaimantSection } from '@/components/report/accident-info/claimant-section'
import { OpponentSection } from '@/components/report/accident-info/opponent-section'
import { VisitSection } from '@/components/report/accident-info/visit-section'
import { ExpertOpinionSection } from '@/components/report/accident-info/expert-opinion-section'
import { SignatureSection } from '@/components/report/accident-info/signature-section'
import type { AccidentInfoFormData } from '@/components/report/accident-info/types'

type SignatureType = 'LAWYER' | 'DATA_PERMISSION' | 'CANCELLATION'

function AccidentInfoPage() {
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useAccidentInfo(reportId)
	const { data: report } = useReport(reportId)
	const saveSignature = useSaveSignature(reportId)

	const { saveField, flushNow, state: autoSaveState } = useAutoSave({
		reportId,
		section: 'accident-info',
		disabled: report?.isLocked,
	})

	const [signatureModalType, setSignatureModalType] = useState<SignatureType | null>(null)
	const [signatureValue, setSignatureValue] = useState('')

	const {
		register,
		control,
		formState: { errors },
		reset,
	} = useForm<AccidentInfoFormData>({
		defaultValues: {
			accidentDay: '',
			accidentScene: '',
			claimantCompany: '',
			claimantSalutation: '',
			claimantFirstName: '',
			claimantLastName: '',
			claimantStreet: '',
			claimantPostcode: '',
			claimantLocation: '',
			claimantEmail: '',
			claimantPhone: '',
			claimantVehicleMake: '',
			claimantLicensePlate: '',
			claimantEligibleForInputTaxDeduction: false,
			claimantIsVehicleOwner: true,
			claimantRepresentedByLawyer: false,
			claimantInvolvedLawyer: '',
			opponentCompany: '',
			opponentSalutation: '',
			opponentFirstName: '',
			opponentLastName: '',
			opponentStreet: '',
			opponentPostcode: '',
			opponentLocation: '',
			opponentEmail: '',
			opponentPhone: '',
			opponentInsuranceCompany: '',
			opponentInsuranceNumber: '',
			expertName: '',
			fileNumber: '',
			caseDate: '',
			orderWasPlacement: '',
			issuedDate: '',
			orderByClaimant: false,
			mediator: '',
			visits: [],
		},
	})

	// Populate form when data loads
	useEffect(() => {
		if (!data) return

		const formData: Partial<AccidentInfoFormData> = {}

		if (data.accidentInfo) {
			formData.accidentDay = data.accidentInfo.accidentDay?.split('T')[0] ?? ''
			formData.accidentScene = data.accidentInfo.accidentScene ?? ''
		}

		if (data.claimantInfo) {
			const c = data.claimantInfo
			formData.claimantCompany = c.company ?? ''
			formData.claimantSalutation = c.salutation ?? ''
			formData.claimantFirstName = c.firstName ?? ''
			formData.claimantLastName = c.lastName ?? ''
			formData.claimantStreet = c.street ?? ''
			formData.claimantPostcode = c.postcode ?? ''
			formData.claimantLocation = c.location ?? ''
			formData.claimantEmail = c.email ?? ''
			formData.claimantPhone = c.phone ?? ''
			formData.claimantVehicleMake = c.vehicleMake ?? ''
			formData.claimantLicensePlate = c.licensePlate ?? ''
			formData.claimantEligibleForInputTaxDeduction = c.eligibleForInputTaxDeduction
			formData.claimantIsVehicleOwner = c.isVehicleOwner
			formData.claimantRepresentedByLawyer = c.representedByLawyer
			formData.claimantInvolvedLawyer = c.involvedLawyer ?? ''
		}

		if (data.opponentInfo) {
			const o = data.opponentInfo
			formData.opponentCompany = o.company ?? ''
			formData.opponentSalutation = o.salutation ?? ''
			formData.opponentFirstName = o.firstName ?? ''
			formData.opponentLastName = o.lastName ?? ''
			formData.opponentStreet = o.street ?? ''
			formData.opponentPostcode = o.postcode ?? ''
			formData.opponentLocation = o.location ?? ''
			formData.opponentEmail = o.email ?? ''
			formData.opponentPhone = o.phone ?? ''
			formData.opponentInsuranceCompany = o.insuranceCompany ?? ''
			formData.opponentInsuranceNumber = o.insuranceNumber ?? ''
		}

		if (data.expertOpinion) {
			const e = data.expertOpinion
			formData.expertName = e.expertName ?? ''
			formData.fileNumber = e.fileNumber ?? ''
			formData.caseDate = e.caseDate?.split('T')[0] ?? ''
			formData.orderWasPlacement = e.orderWasPlacement ?? ''
			formData.issuedDate = e.issuedDate?.split('T')[0] ?? ''
			formData.orderByClaimant = e.orderByClaimant
			formData.mediator = e.mediator ?? ''
		}

		if (data.visits && data.visits.length > 0) {
			formData.visits = data.visits.map((v) => ({
				type: v.type,
				street: v.street ?? '',
				postcode: v.postcode ?? '',
				location: v.location ?? '',
				date: v.date?.split('T')[0] ?? '',
				expert: v.expert ?? '',
				vehicleCondition: v.vehicleCondition ?? '',
			}))
		}

		reset(formData as AccidentInfoFormData)
	}, [data, reset])

	const handleFieldBlur = useCallback(
		(field: string) => {
			// Map form field names to API section structure
			const value = document.querySelector<HTMLInputElement>(`[name="${field}"]`)?.value
			if (value === undefined) return

			if (field.startsWith('claimant')) {
				const apiField = field.replace('claimant', '')
				const key = apiField.charAt(0).toLowerCase() + apiField.slice(1)
				saveField(`claimantInfo.${key}`, value)
			} else if (field.startsWith('opponent')) {
				const apiField = field.replace('opponent', '')
				const key = apiField.charAt(0).toLowerCase() + apiField.slice(1)
				saveField(`opponentInfo.${key}`, value)
			} else if (field.startsWith('expert') || field === 'fileNumber' || field === 'caseDate' || field === 'orderWasPlacement' || field === 'issuedDate' || field === 'mediator') {
				saveField(`expertOpinion.${field}`, value)
			} else {
				saveField(`accidentInfo.${field}`, value)
			}
		},
		[saveField],
	)

	const handleSignatureSave = useCallback(() => {
		if (!signatureModalType || !signatureValue) return

		saveSignature.mutate({
			type: signatureModalType,
			imageUrl: signatureValue,
		})

		setSignatureModalType(null)
		setSignatureValue('')
	}, [signatureModalType, signatureValue, saveSignature])

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-grey-50 border-t-primary" />
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-6">
			{/* Page heading with completion badge + auto-save status */}
			<div className="flex items-center justify-between">
				<h2 className="text-h3 font-bold text-black">Accident Overview</h2>
				<div className="flex items-center gap-3">
					{autoSaveState.status === 'saving' && (
						<span className="flex items-center gap-1 text-caption text-grey-100">
							<Loader2 className="h-3 w-3 animate-spin" />
							Saving...
						</span>
					)}
					{autoSaveState.status === 'saved' && (
						<span className="flex items-center gap-1 text-caption text-primary">
							<CheckCircle2 className="h-3 w-3" />
							Saved
						</span>
					)}
					{autoSaveState.status === 'error' && (
						<span className="text-caption text-error">Failed to save</span>
					)}
					<span className="text-body-sm text-grey-100">64% Complete</span>
				</div>
			</div>

			{/* Form sections */}
			<AccidentSection
				register={register}
				control={control}
				errors={errors}
				onFieldBlur={handleFieldBlur}
			/>

			<ClaimantSection
				register={register}
				control={control}
				errors={errors}
				onFieldBlur={handleFieldBlur}
			/>

			<OpponentSection
				register={register}
				control={control}
				errors={errors}
				onFieldBlur={handleFieldBlur}
			/>

			<VisitSection
				register={register}
				control={control}
				errors={errors}
				onFieldBlur={handleFieldBlur}
			/>

			<ExpertOpinionSection
				register={register}
				control={control}
				errors={errors}
				onFieldBlur={handleFieldBlur}
			/>

			<SignatureSection
				signatures={data?.signatures ?? []}
				onSignatureClick={setSignatureModalType}
			/>

			{/* Signature Modal */}
			<Modal
				title="Your Signature"
				open={signatureModalType !== null}
				onClose={() => {
					setSignatureModalType(null)
					setSignatureValue('')
				}}
				size="md"
				footer={
					<>
						<Button
							variant="outline"
							onClick={() => {
								setSignatureModalType(null)
								setSignatureValue('')
							}}
						>
							Cancel
						</Button>
						<Button
							variant="primary"
							onClick={handleSignatureSave}
							disabled={!signatureValue}
						>
							Save
						</Button>
					</>
				}
			>
				<SignaturePad
					value={signatureValue}
					onChange={setSignatureValue}
				/>
				<p className="mt-4 text-caption text-grey-100">
					By signing this document with an electronic signature, I agree that such signature will be extend allowed by local law.
				</p>
			</Modal>

			{/* Update Report button */}
			<div className="flex justify-end">
				<Button variant="primary" onClick={flushNow} loading={autoSaveState.status === 'saving'}>
					Update Report
				</Button>
			</div>
		</div>
	)
}

export default AccidentInfoPage
