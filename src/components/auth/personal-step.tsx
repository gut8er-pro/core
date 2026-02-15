'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupPersonalSchema, type SignupPersonalInput } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup-store'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'

const titleOptions = [
	{ value: 'mr', label: 'Mr' },
	{ value: 'mrs', label: 'Mrs' },
	{ value: 'dr', label: 'Dr' },
	{ value: 'prof', label: 'Prof' },
	{ value: 'prof_dr', label: 'Prof. Dr.' },
]

function PersonalStep() {
	const router = useRouter()
	const { personal, setPersonal, completeStep, setCurrentStep } = useSignupStore()

	const {
		register,
		handleSubmit,
		setValue,
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
		<div>
			<h2 className="mb-1 text-h2 font-bold text-black">Personal details</h2>
			<p className="mb-8 text-body text-grey-100">Tell us about yourself</p>

			<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
				<SelectField
					label="Title"
					options={titleOptions}
					placeholder="Select title"
					error={errors.title?.message}
					onValueChange={(value) => setValue('title', value)}
					defaultValue={personal.title}
				/>
				<div className="grid grid-cols-2 gap-4">
					<TextField
						label="First name"
						placeholder="First name"
						error={errors.firstName?.message}
						{...register('firstName')}
					/>
					<TextField
						label="Last name"
						placeholder="Last name"
						error={errors.lastName?.message}
						{...register('lastName')}
					/>
				</div>
				<TextField
					label="Phone number"
					type="tel"
					placeholder="+49"
					error={errors.phone?.message}
					{...register('phone')}
				/>
				<TextField
					label="Professional qualification"
					placeholder="eg. Kfz-Sachverständiger, Dipl.-Ing."
					hint="Optional"
					{...register('professionalQualification')}
				/>

				<div className="mt-4 flex items-center gap-4">
					<Button type="button" variant="ghost" onClick={handleBack}>
						Back
					</Button>
					<Button type="submit" loading={isSubmitting} className="flex-1">
						Continue
					</Button>
				</div>
			</form>
		</div>
	)
}

export { PersonalStep }
