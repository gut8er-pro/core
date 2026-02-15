import Stripe from 'stripe'

function getStripeClient(): Stripe {
	const key = process.env.STRIPE_SECRET_KEY
	if (!key) throw new Error('Missing STRIPE_SECRET_KEY')
	return new Stripe(key)
}

export { getStripeClient }
