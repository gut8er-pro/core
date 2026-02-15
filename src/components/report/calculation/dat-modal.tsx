'use client'

import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/text-field'

function DatModal() {
	const [open, setOpen] = useState(false)

	return (
		<>
			<Button
				type="button"
				variant="secondary"
				icon={<Calculator className="h-4 w-4" />}
				onClick={() => setOpen(true)}
			>
				Open DAT Calculator
			</Button>

			<Modal
				title="DAT SilverDAT3 Calculator"
				open={open}
				onClose={() => setOpen(false)}
				size="lg"
				footer={
					<>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							variant="primary"
							onClick={() => setOpen(false)}
						>
							Save
						</Button>
					</>
				}
			>
				<div className="flex flex-col gap-6">
					<p className="text-body-sm text-grey-100">
						Connect to DAT SilverDAT3 to calculate repair costs. Configure your DAT
						credentials in Settings to enable this feature.
					</p>

					{/* Workshop Section (placeholder) */}
					<div className="flex flex-col gap-4 rounded-lg border border-border bg-grey-25 p-4">
						<h4 className="text-h4 font-semibold text-black">Workshop</h4>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<TextField
								label="Workshop Name"
								placeholder="Enter workshop name"
								disabled
							/>
							<TextField
								label="Workshop ID"
								placeholder="DAT workshop ID"
								disabled
							/>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<TextField
								label="Hourly Rate (Body)"
								type="number"
								prefix="EUR"
								placeholder="0.00"
								disabled
							/>
							<TextField
								label="Hourly Rate (Paint)"
								type="number"
								prefix="EUR"
								placeholder="0.00"
								disabled
							/>
						</div>

						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<TextField
								label="Hourly Rate (Mechanics)"
								type="number"
								prefix="EUR"
								placeholder="0.00"
								disabled
							/>
							<TextField
								label="Hourly Rate (Electrics)"
								type="number"
								prefix="EUR"
								placeholder="0.00"
								disabled
							/>
						</div>
					</div>

					<div className="flex flex-col gap-2 rounded-lg border border-border bg-grey-25 p-4">
						<h4 className="text-h4 font-semibold text-black">Calculation Result</h4>
						<p className="text-body-sm text-grey-100">
							No calculation available yet. Connect your DAT account and run the
							calculator to see repair cost results here.
						</p>
					</div>
				</div>
			</Modal>
		</>
	)
}

export { DatModal }
