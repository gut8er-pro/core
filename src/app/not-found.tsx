import Link from 'next/link'
import { Button } from '@/components/ui/button'

function NotFoundPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-4">
			<p className="text-display font-bold text-primary">404</p>
			<h1 className="mt-4 text-h2 font-bold text-black">Page not found</h1>
			<p className="mt-2 text-center text-body-sm text-grey-100">
				The page you&apos;re looking for doesn&apos;t exist or has been moved.
			</p>
			<div className="mt-8 flex items-center gap-4">
				<Button asChild>
					<Link href="/dashboard">Go to Dashboard</Link>
				</Button>
				<Button variant="ghost" asChild>
					<Link href="/">Go Home</Link>
				</Button>
			</div>
		</div>
	)
}

export default NotFoundPage
