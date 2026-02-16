'use client'

import { ExternalLink, Info } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'
import { SelectField } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

type DatModalProps = {
	open: boolean
	onClose: () => void
}

const LOCATION_OPTIONS = [
	{ value: 'hamburg', label: 'Hamburg' },
	{ value: 'berlin', label: 'Berlin' },
	{ value: 'munich', label: 'Munich' },
	{ value: 'frankfurt', label: 'Frankfurt' },
]

function DatModal({ open, onClose }: DatModalProps) {
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
						onClick={onClose}
					>
						Save
					</Button>
				</div>
			}
		>
			<div className="flex flex-col gap-6">
				{/* DAT Logo */}
				<div className="flex justify-center">
					<div className="flex h-24 w-24 items-center justify-center rounded-lg bg-[#FFCC00] text-[#003366]">
						<span className="text-h3 font-bold">DAT</span>
					</div>
				</div>

				{/* Workshop Section */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<h4 className="text-body font-semibold text-black">Workshop</h4>
						<Info className="h-4 w-4 text-grey-100" />
					</div>

					<div className="flex items-center justify-between gap-4">
						<label className="flex items-center gap-2 cursor-pointer">
							<Checkbox />
							<span className="text-body-sm text-black">DEKRA set are used</span>
						</label>

						<div className="w-48">
							<SelectField
								label="Location"
								options={LOCATION_OPTIONS}
								placeholder="Choose"
							/>
						</div>
					</div>

					<TextField
						label="Mechanics"
						placeholder="Mechanics name"
					/>

					<TextField
						label="Body"
						placeholder="Vehicle body"
					/>

					<TextField
						label="Paintwork"
						placeholder="Vehicle paintwork"
					/>
				</div>

				{/* Market Value Section */}
				<div className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<h4 className="text-body font-semibold text-black">Market Value</h4>
						<Info className="h-4 w-4 text-grey-100" />
					</div>

					<button
						type="button"
						className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-border bg-white px-4 py-3 transition-colors hover:bg-grey-25"
					>
						<div className="flex items-center gap-3">
							<div className="flex h-8 w-8 items-center justify-center rounded bg-[#FFCC00] text-[#003366]">
								<span className="text-caption font-bold">DAT</span>
							</div>
							<span className="text-body-sm font-medium text-black">DAT nesto</span>
						</div>
						<ExternalLink className="h-4 w-4 text-grey-100" />
					</button>
				</div>
			</div>
		</Modal>
	)
}

export { DatModal }
