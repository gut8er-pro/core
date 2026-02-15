'use server'

import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { loginSchema, signupAccountSchema } from '@/lib/validations/auth'
import { getStripeClient } from '@/lib/stripe/client'

async function login(formData: FormData): Promise<{ error?: string }> {
	const raw = {
		email: formData.get('email') as string,
		password: formData.get('password') as string,
	}

	const parsed = loginSchema.safeParse(raw)
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message || 'Invalid input' }
	}

	const supabase = await createClient()
	const { error } = await supabase.auth.signInWithPassword({
		email: parsed.data.email,
		password: parsed.data.password,
	})

	if (error) {
		return { error: 'Email or password is incorrect' }
	}

	redirect('/dashboard')
}

async function signup(formData: FormData): Promise<{ error?: string }> {
	const raw = {
		email: formData.get('email') as string,
		password: formData.get('password') as string,
		confirmPassword: formData.get('confirmPassword') as string,
	}

	const parsed = signupAccountSchema.safeParse(raw)
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message || 'Invalid input' }
	}

	const supabase = await createClient()
	const { error } = await supabase.auth.signUp({
		email: parsed.data.email,
		password: parsed.data.password,
	})

	if (error) {
		return { error: error.message }
	}

	return {}
}

type CompleteSignupInput = {
	account: { email: string; password: string }
	personal: {
		title?: string
		firstName?: string
		lastName?: string
		phone?: string
		professionalQualification?: string
	}
	business: {
		companyName?: string
		street?: string
		postcode?: string
		city?: string
		taxId?: string
		vatId?: string
	}
	plan: { plan: 'pro' }
	integrations: {
		provider?: string
		username?: string
		password?: string
	}
}

async function completeSignup(
	input: CompleteSignupInput,
): Promise<{ error?: string }> {
	const { account, personal, business, plan, integrations } = input

	if (!account.email || !account.password) {
		return { error: 'Email and password are required' }
	}

	// 1. Create the Supabase auth user with admin API (auto-confirms email)
	const admin = createAdminClient()
	const { data: authData, error: authError } =
		await admin.auth.admin.createUser({
			email: account.email,
			password: account.password,
			email_confirm: true,
		})

	if (authError) {
		if (authError.message.includes('already been registered')) {
			return { error: 'An account with this email already exists' }
		}
		return { error: authError.message }
	}

	const authUserId = authData.user.id

	// 2. Create User record in our database
	try {
		const planValue = 'PRO' as const
		const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

		// Filter out "$undefined" strings from Next.js server action serialization
		const cleanStr = (val: string | undefined) =>
			val && val !== '$undefined' ? val : null
		const hasBusinessData = !!cleanStr(business.companyName)
		const validProviders = ['DAT', 'AUDATEX', 'GT_MOTIVE']
		const providerStr = cleanStr(integrations.provider)?.toUpperCase()
		const hasIntegration =
			providerStr && validProviders.includes(providerStr)

		console.log('[completeSignup] Creating DB user:', {
			authUserId,
			email: account.email,
			plan: planValue,
			hasBusinessData,
			hasIntegration,
		})

		await prisma.user.create({
			data: {
				id: authUserId,
				email: account.email,
				title: cleanStr(personal.title),
				firstName: cleanStr(personal.firstName),
				lastName: cleanStr(personal.lastName),
				phone: cleanStr(personal.phone),
				professionalQualification: cleanStr(
					personal.professionalQualification,
				),
				plan: planValue,
				trialEndsAt,
				...(hasBusinessData
					? {
							business: {
								create: {
									companyName: business.companyName!,
									street: cleanStr(business.street) || '',
									postcode:
										cleanStr(business.postcode) || '',
									city: cleanStr(business.city) || '',
									taxId: cleanStr(business.taxId) || '',
									vatId: cleanStr(business.vatId),
								},
							},
						}
					: {}),
				...(hasIntegration
					? {
							integrations: {
								create: {
									provider: providerStr as
										| 'DAT'
										| 'AUDATEX'
										| 'GT_MOTIVE',
									encryptedCredentials: cleanStr(
										integrations.username,
									)
										? JSON.stringify({
												username:
													integrations.username,
												password:
													integrations.password,
											})
										: null,
									isActive: !!cleanStr(
										integrations.username,
									),
								},
							},
						}
					: {}),
			},
		})
		console.log('[completeSignup] DB user created successfully')

		// 2b. Create Stripe customer (non-blocking — checkout route
		// will create one if this fails)
		if (process.env.STRIPE_SECRET_KEY) {
			try {
				const stripe = getStripeClient()
				const customer = await stripe.customers.create({
					email: account.email,
					metadata: { userId: authUserId },
				})
				await prisma.user.update({
					where: { id: authUserId },
					data: { stripeCustomerId: customer.id },
				})
				console.log('[completeSignup] Stripe customer created:', customer.id)
			} catch (stripeError) {
				// Non-fatal — the checkout route will create the customer if needed
				console.warn('[completeSignup] Stripe customer creation failed (non-fatal):', stripeError)
			}
		}
	} catch (dbError) {
		// If DB creation fails, clean up the auth user
		await admin.auth.admin.deleteUser(authUserId)
		const errMsg =
			dbError instanceof Error ? dbError.message : String(dbError)
		console.error('[completeSignup] Failed to create user record:', errMsg)
		return { error: `Failed to create account: ${errMsg}` }
	}

	// 3. Sign in the user so they get a session
	const supabase = await createClient()
	await supabase.auth.signInWithPassword({
		email: account.email,
		password: account.password,
	})

	return {}
}

async function signInWithGoogle() {
	const supabase = await createClient()
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'google',
		options: {
			redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
		},
	})

	if (error || !data.url) {
		redirect('/login?error=oauth_failed')
	}

	redirect(data.url)
}

async function signInWithApple() {
	const supabase = await createClient()
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: 'apple',
		options: {
			redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
		},
	})

	if (error || !data.url) {
		redirect('/login?error=oauth_failed')
	}

	redirect(data.url)
}

async function logout() {
	const supabase = await createClient()
	await supabase.auth.signOut()
	redirect('/login')
}

export {
	login,
	signup,
	completeSignup,
	signInWithGoogle,
	signInWithApple,
	logout,
}
