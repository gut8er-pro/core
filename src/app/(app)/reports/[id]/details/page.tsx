import { redirect } from 'next/navigation'

type Props = {
	params: Promise<{ id: string }>
}

async function DetailsRedirect({ params }: Props) {
	const { id } = await params
	redirect(`/reports/${id}/details/accident-info`)
}

export default DetailsRedirect
