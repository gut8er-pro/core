'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { type SignupPersonalInput, signupPersonalSchema } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup-store'

const TITLE_OPTIONS = [
	{ value: 'mr', label: 'Mr' },
	{ value: 'mrs', label: 'Mrs' },
	{ value: 'dr', label: 'Dr' },
	{ value: 'prof', label: 'Prof' },
	{ value: 'prof_dr', label: 'Prof. Dr.' },
]

const INPUT_CLS =
	'h-[53px] w-full rounded-[15px] border-[1.5px] border-[#e5e7eb] bg-white px-3.5 text-[18px] text-black placeholder:text-black/45 focus:border-primary focus:outline-none'
const LABEL_CLS = 'text-[16px] font-medium text-black'
const FIELD_CLS = 'flex flex-col gap-3'

function PersonalStep() {
	const router = useRouter()
	const { personal, setPersonal, completeStep, setCurrentStep } = useSignupStore()

	const {
		register,
		control,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignupPersonalInput>({
		resolver: zodResolver(signupPersonalSchema),
		defaultValues: {
			title: personal.title || '',
			firstName: personal.firstName || '',
			lastName: personal.lastName || '',
			phone: personal.phone || '',
			professionalQualification: personal.professionalQualification || '',
		},
	})

	function onSubmit(data: SignupPersonalInput) {
		setPersonal(data)
		completeStep(2)
		setCurrentStep(3)
		router.push('/signup/business')
	}

	function handleBack() {
		setCurrentStep(1)
		router.push('/signup/account')
	}

	return (
		<div className="flex flex-col gap-8">
			{/* Header */}
			<div className="flex flex-col gap-3.5">
				<h2 className="text-[44px] font-medium leading-none text-black">Personal details</h2>
				<p className="text-[18px] leading-snug tracking-[0.18px] text-black/70">
					Tell us a bit about yourself.
				</p>
			</div>

			<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
				<div className="flex flex-col gap-6">
					{/* Title / First name / Last name */}
					<div className="grid grid-cols-3 gap-3.5">
						{/* Title dropdown */}
						<div className={FIELD_CLS}>
							<label className={LABEL_CLS}>Title</label>
							<div className="relative">
								<Controller
									name="title"
									control={control}
									render={({ field }) => (
										<select
											{...field}
											className="h-[53px] w-full appearance-none rounded-[15px] border-[1.5px] border-[#e5e7eb] bg-white px-3.5 pr-10 text-[18px] text-black focus:border-primary focus:outline-none"
										>
											<option value="">Select</option>
											{TITLE_OPTIONS.map((o) => (
												<option key={o.value} value={o.value}>
													{o.label}
												</option>
											))}
										</select>
									)}
								/>
								<ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-grey-100" />
							</div>
							{errors.title && <p className="text-[14px] text-error">{errors.title.message}</p>}
						</div>

						{/* First name */}
						<div className={FIELD_CLS}>
							<label className={LABEL_CLS}>First name</label>
							<input {...register('firstName')} placeholder="Name" className={INPUT_CLS} />
							{errors.firstName && (
								<p className="text-[14px] text-error">{errors.firstName.message}</p>
							)}
						</div>

						{/* Last name */}
						<div className={FIELD_CLS}>
							<label className={LABEL_CLS}>Last name</label>
							<input {...register('lastName')} placeholder="Last name" className={INPUT_CLS} />
							{errors.lastName && (
								<p className="text-[14px] text-error">{errors.lastName.message}</p>
							)}
						</div>
					</div>

					{/* Phone */}
					<div className={FIELD_CLS}>
						<label className={LABEL_CLS}>Phone number</label>
						<input
							{...register('phone')}
							type="tel"
							placeholder="+49 123 456789"
							className={INPUT_CLS}
						/>
						{errors.phone && <p className="text-[14px] text-error">{errors.phone.message}</p>}
					</div>

					{/* Professional qualification */}
					<div className={FIELD_CLS}>
						<label className={LABEL_CLS}>Professional qualification</label>
						<input
							{...register('professionalQualification')}
							placeholder="e.g., Kfz-Sachverständiger, Dipl.-Ing."
							className={INPUT_CLS}
						/>
					</div>
				</div>

				{/* Generic fallback — catches any field error not shown above */}
				{Object.keys(errors).length > 0 && (
					<div className="rounded-[15px] bg-error-light px-4 py-2.5 text-[14px] text-error">
						Please fill in all required fields above.
					</div>
				)}

				{/* Buttons */}
				<div className="flex gap-3.5">
					<button
						type="button"
						onClick={handleBack}
						className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] border border-[#e5e7eb] bg-white px-[30px] text-[18px] font-medium text-black transition-colors hover:bg-grey-25"
					>
						Back
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="flex h-[58px] flex-1 items-center justify-center rounded-[15px] bg-primary px-[30px] text-[18px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
					>
						{isSubmitting ? 'Saving...' : 'Continue'}
					</button>
				</div>
			</form>
		</div>
	)
}

export { PersonalStep }
