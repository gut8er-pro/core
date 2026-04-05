# Suite 01: Authentication Flow

## Test Account
- Email: `ivanvukasino+2@gmail.com`
- Password: `Ivanivan1!`

---

## 1.1 Landing Page (`/`)
- [ ] Navigate to `/` — page loads, title "Gut8erPRO - Professional Vehicle Assessment"
- [ ] Hero section: heading "Professional Vehicle Assessment Made Simple"
- [ ] Badge: "Now with AI-powered auto-fill"
- [ ] CTA: "Start Free Trial" button visible and green (#019447)
- [ ] Stats cards: "-35% Report time", "-60% Manual work", "2,000+ Professionals"
- [ ] Navbar: Logo (left), "Log In" link, "Sign Up for Free" button (right)
- [ ] Hero image: car damage scene visible
- [ ] Feature cards section (scroll down): 4 cards
- [ ] FAQ section: 5 collapsible items
- [ ] Footer: "© 2026 Gut8erPRO. All rights reserved."
- [ ] Click "Start Free Trial" → navigates to `/signup/account`
- [ ] Click "Log In" → navigates to `/login`
- [ ] No console errors
- **Figma:** `design/Welcome Screen/🟢 WELCOME SCREEN.png`, `design/Welcome Screen/🟢 Features.png`

## 1.2 Login Page (`/login`)
- [ ] Left panel: Gut8erPRO logo, "Professional Vehicle Assessment Web App" heading
- [ ] Left panel: stat badges "-35%" and "-40%"
- [ ] Left panel: car illustration at bottom
- [ ] Right panel: "Welcome back" heading, "Please log in to your account to continue." subtitle
- [ ] Email field: label "Email address", placeholder "Enter your email"
- [ ] Password field: label "Password", placeholder "Enter your password"
- [ ] Password eye toggle: click shows/hides password text
- [ ] "Forgot password?" link (green, right of Password label) → `/forgot-password`
- [ ] "Log in" button: green, full width
- [ ] "Don't have an account? Sign Up" text with green link → `/signup/account`
- [ ] Divider: "Or"
- [ ] Social buttons: "Login with Google" + "Login with Apple" (side by side)
- [ ] **Edge: Submit empty** → browser validation on email field
- [ ] **Edge: Wrong credentials** → red error banner "Email or password is incorrect"
- [ ] **Edge: Valid login** → `ivanvukasino+2@gmail.com` / `Ivanivan1!` → redirects to `/dashboard`
- [ ] No console errors
- **Figma:** `design/Login and Sign Up/🟢 LOGIN/Gut8erPRO - Login.png`

## 1.3 Forgot Password (`/forgot-password`)
- [ ] Left panel: same branding as login
- [ ] Right panel: "Reset password" heading
- [ ] Subtitle: "Enter your email address and we'll send you a link to reset your password."
- [ ] Email input field
- [ ] "Send reset link" green button
- [ ] "Back to login" green link
- [ ] **Submit with email** → screen changes to "Check your email" confirmation
- [ ] Confirmation: "We sent a password reset link to your email address."
- [ ] "Didn't receive the email? Check your spam folder or try again."
- [ ] "Try again" button → returns to email form
- [ ] "Back to login" link → `/login`
- [ ] **Edge: Submit empty** → browser validation
- [ ] No console errors

## 1.4 Reset Password (`/reset-password`)
- [ ] Left panel: same branding
- [ ] "Set new password" heading
- [ ] "Enter your new password below. Must be at least 8 characters."
- [ ] "New password" field with eye toggle
- [ ] "Confirm password" field with eye toggle
- [ ] "Update password" green button
- [ ] **Edge: Mismatched passwords** → "Passwords do not match" error
- [ ] **Edge: Short password (<8)** → "Password must be at least 8 characters" error
- [ ] **Edge: No session (direct visit)** → "Failed to update password. The link may have expired." error
- [ ] **Valid submission** (via email link) → "Password updated" + auto-redirect to `/login`
- [ ] No console errors

## 1.5 Signup Flow (`/signup/*`)

### Step 1: Account (`/signup/account`)
- [ ] Left sidebar: stepper with 5 steps (Account highlighted green)
- [ ] Progress bar at top
- [ ] "Create your account" heading
- [ ] Fields: Email address, Password, Confirm password
- [ ] "Continue" green button
- [ ] "Already have an account? Log in" link at bottom
- [ ] **Edge: Mismatched passwords** → inline error
- [ ] **Edge: Short password** → inline error
- **Figma:** `design/Login and Sign Up/🟢 LOGIN/01-Gut8erPRO - Signup _ Account.png`

### Step 2: Personal (`/signup/personal`)
- [ ] Stepper: Personal step highlighted
- [ ] "Personal details" heading
- [ ] Fields: Title (dropdown: Mr, Mrs, Dr, Prof), First Name, Last Name
- [ ] Phone field with country code "+49"
- [ ] Professional Qualification (optional)
- [ ] "Back" and "Continue" buttons
- **Figma:** `design/Login and Sign Up/🟢 LOGIN/02-Gut8erPRO - Signup _ Personal.png`

### Step 3: Business (`/signup/business`)
- [ ] "Business information" heading
- [ ] Fields: Company Name, Street & House Number, Postcode, City
- [ ] Tax fields: Steuernummer, USt-IdNr (optional)
- [ ] KBA Main Token
- [ ] "Back" and "Continue" buttons
- **Figma:** `design/Login and Sign Up/🟢 LOGIN/03-Gut8erPRO - Signup _ Business.png`

### Step 4: Plan (`/signup/plan`)
- [ ] "Your plan" heading
- [ ] Single Pro plan card: €69/month, "7 days free"
- [ ] All features listed (AI auto-fill, image analysis, VIN detection, etc.)
- [ ] Payment info note: card collected via Stripe Checkout after account creation
- [ ] "You won't be charged until your 7-day trial ends. Cancel anytime."
- [ ] Back and Continue buttons
- **Figma:** `design/Login and Sign Up/🟢 LOGIN/04-Gut8erPRO - Signup _ Plans.png`

### Step 5: Integrations (`/signup/integrations`)
- [ ] "Connect your tools" heading
- [ ] Provider cards: DAT (active), Audatex (Coming Soon), GT Motive (Coming Soon)
- [ ] Click DAT → shows "DAT SilverDAT3 Credentials" form: Username, Password
- [ ] "Don't have an account? Register with DAT" link
- [ ] "Back" and "Create an Account" buttons
- **Figma:** `design/Login and Sign Up/🟢 LOGIN/05-06*.png`

### Step 6: Complete (`/signup/complete`)
- [ ] Green checkmark icon
- [ ] "Welcome aboard!" heading
- [ ] "Your account has been created successfully."
- [ ] Plan badge: "Pro Plan · 7-day free trial started"
- [ ] 3 quick-start cards: Create Report, Enjoy AI, Settings
- [ ] "Create your first report" and "Go to Dashboard" buttons
- [ ] "We've sent a confirmation email to your email"
- **Figma:** `design/Login and Sign Up/🟢 LOGIN/07-Gut8erPRO - Signup _ Complete.png`

## 1.6 Logout
- [ ] Click user avatar in navbar → dropdown with "Logout"
- [ ] Click Logout → redirects to `/login`
- [ ] Visit `/dashboard` after logout → redirects to `/login`
