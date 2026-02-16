'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupBusinessSchema, type SignupBusinessInput } from '@/lib/validations/auth'
import { useSignupStore } from '@/stores/signup-store'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'

function BusinessStep() {
	const router = useRouter()
	const { business, setBusiness, completeStep, setCurrentStep } = useSignupStore()

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignupBusinessInput>({
		resolver: zodResolver(signupBusinessSchema),
		defaultValues: {
			companyName: business.companyName || '',
			street: business.street || '',
			postcode: business.postcode || '',
			city: business.city || '',
			taxId: business.taxId || '',
			vatId: business.vatId || '',
		},
	})

	function onSubmit(data: SignupBusinessInput) {
		setBusiness(data)
		completeStep(3)
		setCurrentStep(4)
		router.push('/signup/plan')
	}

	function handleBack() {
		setCurrentStep(2)
		router.push('/signup/personal')
	}

	return (
		<div>
			<h2 className="mb-1 text-h2 font-bold text-black">Business information</h2>
			<p className="mb-8 text-body text-grey-100">
				Your company details for invoices and reports.
			</p>

			<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
				<TextField
					label="Company name"
					placeholder="Mustermann Gutachten GmbH"
					error={errors.companyName?.message}
					{...register('companyName')}
				/>
				<TextField
					label="Street & house number"
					placeholder="Musterstraße 123"
					error={errors.street?.message}
					{...register('street')}
				/>
				<div className="grid grid-cols-2 gap-4">
					<TextField
						label="Postcode"
						placeholder="1234"
						error={errors.postcode?.message}
						{...register('postcode')}
					/>
					<TextField
						label="City"
						placeholder="Berlin"
						error={errors.city?.message}
						{...register('city')}
					/>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<TextField
						label="Tax ID (Steuernummer)"
						placeholder="123/456/78901"
						error={errors.taxId?.message}
						{...register('taxId')}
					/>
					<TextField
						label="VAT ID (USt-IdNr.) Optional"
						placeholder="DE123456789"
						error={errors.vatId?.message}
						{...register('vatId')}
					/>
				</div>

				<div className="mt-4 flex items-center gap-4">
					<Button type="button" variant="outline" onClick={handleBack} className="flex-1">
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

export { BusinessStep }
