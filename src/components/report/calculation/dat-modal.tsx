'use client'

import { useState, useCallback } from 'react'
import { ExternalLink, Info } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

type DatFormData = {
	location: string
	dekraUsed: boolean
	mechanics: string
	body: string
	paintwork: string
}

type DatModalProps = {
	open: boolean
	onClose: () => void
	initialData?: Partial<DatFormData>
	onSave?: (data: DatFormData) => void
}

const LOCATION_OPTIONS = [
	{ value: 'hamburg', label: 'Hamburg' },
	{ value: 'berlin', label: 'Berlin' },
	{ value: 'munich', label: 'Munich' },
	{ value: 'frankfurt', label: 'Frankfurt' },
	{ value: 'cologne', label: 'Cologne' },
	{ value: 'dusseldorf', label: 'Dusseldorf' },
	{ value: 'stuttgart', label: 'Stuttgart' },
	{ value: 'hannover', label: 'Hannover' },
]

function DatModal({ open, onClose, initialData, onSave }: DatModalProps) {
	const [location, setLocation] = useState(initialData?.location ?? '')
	const [dekraUsed, setDekraUsed] = useState(initialData?.dekraUsed ?? false)
	const [mechanics, setMechanics] = useState(initialData?.mechanics ?? '')
	const [body, setBody] = useState(initialData?.body ?? '')
	const [paintwork, setPaintwork] = useState(initialData?.paintwork ?? '')

	const handleSave = useCallback(() => {
		onSave?.({ location, dekraUsed, mechanics, body, paintwork })
		onClose()
	}, [location, dekraUsed, mechanics, body, paintwork, onSave, onClose])

	return (
		<Modal
			title="Repair Cost Calculator"
			open={open}
			onClose={onClose}
			size="md"
			footer={
				<div className="flex w-full justify-start">
					<Button
						type="button"
						variant="primary"
						size="md"
						onClick={handleSave}
					>
						Save
					</Button>
				</div>
			}
		>
			<div className="flex flex-col gap-6">
				{/* DAT Logo */}
				<div className="flex justify-center">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src="/images/dat-logo.png"
						alt="DAT"
						className="h-[169px] w-[105px] object-contain"
					/>
				</div>

				{/* Workshop Section */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<h4 className="text-body font-semibold text-black">Workshop</h4>
						<Info className="h-4 w-4 text-grey-100" />
					</div>

					<div className="flex flex-col gap-2 rounded-[20px] border border-[#e8e9eb] p-4">
						<div className="flex items-end justify-between gap-4">
							<label className="flex h-[53px] items-center gap-2 cursor-pointer">
								<Checkbox
									checked={dekraUsed}
									onCheckedChange={(checked) => setDekraUsed(checked === true)}
								/>
								<span className="text-body-sm text-black">DEKRA set are used</span>
							</label>

							<div className="flex-1">
								<SelectField
									label="Location"
									options={LOCATION_OPTIONS}
									placeholder="Choose"
									value={location}
									onValueChange={setLocation}
								/>
							</div>
						</div>

						<TextField
							label="Mechanics"
							placeholder="Mechanics name"
							value={mechanics}
							onChange={(e) => setMechanics(e.target.value)}
						/>

						<TextField
							label="Body"
							placeholder="Vehicle body"
							value={body}
							onChange={(e) => setBody(e.target.value)}
						/>

						<TextField
							label="Paintwork"
							placeholder="Vehicle paintwork"
							value={paintwork}
							onChange={(e) => setPaintwork(e.target.value)}
						/>
					</div>
				</div>

				{/* Market Value Section */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<h4 className="text-body font-semibold text-black">Market Value</h4>
						<Info className="h-4 w-4 text-grey-100" />
					</div>

					<div className="rounded-[20px] border border-[#e8e9eb] p-4">
						<button
							type="button"
							className="flex w-full cursor-pointer items-center justify-between transition-colors hover:opacity-80"
						>
							<div className="flex items-center gap-3">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src="/images/dat-logo.png"
									alt="DAT"
									className="h-[34px] w-[21px] object-contain"
								/>
								<span className="text-body font-medium text-black">DAT SilverDAT3</span>
							</div>
							<ExternalLink className="h-5 w-5 text-grey-100" />
						</button>
					</div>
				</div>
			</div>
		</Modal>
	)
}

export { DatModal }
export type { DatFormData, DatModalProps }
