'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AccidentSection } from '@/components/report/accident-info/accident-section'
import { ClaimantSection } from '@/components/report/accident-info/claimant-section'
import { ExpertOpinionSection } from '@/components/report/accident-info/expert-opinion-section'
import { OpponentSection } from '@/components/report/accident-info/opponent-section'
import { SignatureSection } from '@/components/report/accident-info/signature-section'
import type { AccidentInfoFormData } from '@/components/report/accident-info/types'
import { VisitSection } from '@/components/report/accident-info/visit-section'
import { SignaturePad } from '@/components/signature/signature-pad.dynamic'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useAccidentInfo, useDeleteSignature, useSaveSignature } from '@/hooks/use-accident-info'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useReport } from '@/hooks/use-reports'
import { resolveReportTypeConfig } from '@/lib/report-type'
import { useToastStore } from '@/stores/toast-store'

type SignatureType = 'LAWYER' | 'DATA_PERMISSION' | 'CANCELLATION'

function AccidentInfoPage() {
	const t = useTranslations('report')
	const tc = useTranslations('common')
	const params = useParams<{ id: string }>()
	const reportId = params.id
	const { data, isLoading } = useAccidentInfo(reportId)
	const { data: report } = useReport(reportId)
	const config = resolveReportTypeConfig(report?.reportType)
	const saveSignature = useSaveSignature(reportId)
	const deleteSignature = useDeleteSignature(reportId)

	const {
		saveField,
		flushNow,
		state: autoSaveState,
	} = useAutoSave({
		reportId,
		section: 'accident-info',
		disabled: report?.isLocked,
	})

	const toast = useToastStore()
	const [signatureModalType, setSignatureModalType] = useState<SignatureType | null>(null)
	const [signatureValue, setSignatureValue] = useState('')

	const {
		register,
		control,
		formState: { errors, dirtyFields },
		reset,
		getValues,
		watch,
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
			opponentIban: '',
			opponentPhone: '',
			opponentInsuranceCompany: '',
			opponentInsuranceNumber: '',
			opponentClaimNumber: '',
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

	// Populate form on initial load only (not on refetch after auto-save)
	const initializedRef = useRef(false)
	useEffect(() => {
		if (!data || initializedRef.current) return
		initializedRef.current = true

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
				id: v.id,
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
			// Read from React Hook Form state (works for all field types including
			// selects, radios, checkboxes, and array fields like visits)
			const value = getValues(field as keyof AccidentInfoFormData)
			if (value === undefined) return

			// Visits: save the entire visits array, filtering out empty rows
			if (field.startsWith('visits')) {
				const visits = (getValues('visits') ?? []).filter(
					(v) => v.street || v.postcode || v.location || v.date || v.expert,
				)
				if (visits.length > 0) saveField('visits', visits)
			} else if (field.startsWith('claimant')) {
				const apiField = field.replace('claimant', '')
				const key = apiField.charAt(0).toLowerCase() + apiField.slice(1)
				saveField(`claimantInfo.${key}`, value)
			} else if (field.startsWith('opponent')) {
				const apiField = field.replace('opponent', '')
				const key = apiField.charAt(0).toLowerCase() + apiField.slice(1)
				saveField(`opponentInfo.${key}`, value)
			} else if (
				field.startsWith('expert') ||
				field === 'fileNumber' ||
				field === 'caseDate' ||
				field === 'orderWasPlacement' ||
				field === 'issuedDate' ||
				field === 'mediator'
			) {
				saveField(`expertOpinion.${field}`, value)
			} else {
				saveField(`accidentInfo.${field}`, value)
			}
		},
		[saveField, getValues],
	)

	// Reflect every input change into the auto-save debounce queue, not just
	// blur events. Without this, a user (or a test) that fills a field and
	// immediately navigates / clicks Generate before the input loses focus
	// loses that field — observed on claimantEmail where no blur ever fired
	// on the last-typed field.
	//
	// Field-array entries (visits.0.street etc.) are intentionally excluded:
	// the form doesn't currently round-trip the created row id back from the
	// API, so per-keystroke saves of an unsaved row would produce duplicate
	// DB rows. Visits keep the existing blur-only save path until that round-
	// trip is wired up.
	useEffect(() => {
		const sub = watch((_values, { name, type }) => {
			if (!name || name.includes('.')) return
			// Only save user-initiated changes — reset() also fires watch and
			// would otherwise overwrite the DB with the form's empty defaults.
			if (type !== 'change') return
			if (!dirtyFields[name as keyof AccidentInfoFormData]) return
			handleFieldBlur(name)
		})
		return () => sub.unsubscribe()
	}, [watch, handleFieldBlur, dirtyFields])

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
				<h2 className="text-subsection font-medium text-black">
					{config.customerLabel === 'client'
						? t('accidentInfo.clientInformation')
						: t('accidentInfo.title')}
				</h2>
				<div className="flex items-center gap-3">
					{autoSaveState.status === 'saving' && (
						<span className="flex items-center gap-1 text-caption text-grey-100">
							<Loader2 className="h-3 w-3 animate-spin" />
							{tc('saving')}
						</span>
					)}
					{autoSaveState.status === 'saved' && (
						<span className="flex items-center gap-1 text-caption text-primary">
							<CheckCircle2 className="h-3 w-3" />
							{tc('saved')}
						</span>
					)}
					{autoSaveState.status === 'error' && (
						<span className="text-caption text-error">{tc('failedToSave')}</span>
					)}
					<span className="text-body-sm text-grey-100">
						{(() => {
							const fields = [
								'claimantFirstName',
								'claimantLastName',
								'claimantStreet',
								'claimantEmail',
							] as const
							const filled = fields.filter((f) => getValues(f as keyof AccidentInfoFormData)).length
							return `${Math.round((filled / fields.length) * 100)}% ${tc('complete')}`
						})()}
					</span>
				</div>
			</div>

			{/* Form sections — some hidden per report type */}
			{config.hasAccidentSection && (
				<AccidentSection
					register={register}
					control={control}
					errors={errors}
					onFieldBlur={handleFieldBlur}
				/>
			)}

			<ClaimantSection
				register={register}
				control={control}
				errors={errors}
				onFieldBlur={handleFieldBlur}
				reportType={report?.reportType}
			/>

			{config.hasOpponent && (
				<OpponentSection
					register={register}
					control={control}
					errors={errors}
					onFieldBlur={handleFieldBlur}
				/>
			)}

			<VisitSection
				register={register}
				control={control}
				errors={errors}
				onFieldBlur={handleFieldBlur}
				reportType={report?.reportType}
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
				onSignatureRemove={(sigId) => deleteSignature.mutate(sigId)}
			/>

			{/* Signature Modal */}
			<Modal
				title={t('accidentInfo.signatures.yourSignature')}
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
							{tc('cancel')}
						</Button>
						<Button variant="primary" onClick={handleSignatureSave} disabled={!signatureValue}>
							{tc('save')}
						</Button>
					</>
				}
			>
				<SignaturePad value={signatureValue} onChange={setSignatureValue} />
				<p className="mt-4 text-caption text-grey-100">
					{t('accidentInfo.signatures.signatureConsent')}
				</p>
			</Modal>

			{/* Update Report button */}
			<div className="flex justify-end">
				<Button
					variant="primary"
					onClick={() => {
						flushNow()
						toast.success('Report updated', 2000)
					}}
					loading={autoSaveState.status === 'saving'}
				>
					{t('accidentInfo.updateReport')}
				</Button>
			</div>
		</div>
	)
}

export default AccidentInfoPage
