# Car Insurance Accident Reporting Web Application  
## Project Specification (Phase 1 – Landing Page & Authentication)

## 1. General Overview

This document describes the functional specification of the Car Insurance Accident Reporting Web Application.

All screens, flows, UI components, and interactions are implemented strictly based on the agreed Figma design files. The Figma serves as the single source of truth for layout, structure, field definitions, screen order, and UX behavior.

---

## 2. Public Landing Page

### 2.1 Welcome Page (Static)

**Reference:** “Welcome Page” in Figma  
**Type:** Public, static, one-page layout  
**Purpose:** Provide a brief overview of the platform and its purpose.

### Description

The landing page:

- Is a one-page static website
- Contains no dynamic or authenticated functionality
- Serves as a marketing and informational preview of the system
- Explains what the platform does (accident reporting for insurers)
- Provides navigation to:
  - Log In
  - Sign Up

No user data is collected on this page.

---

## 3. Authentication Flow

The system supports two authentication methods:

1. Email and password
2. Google OAuth

After successful authentication, the user is redirected to the application dashboard (if onboarding is complete) or continues onboarding (if signing up for the first time).

---

## 4. Login Flow

### 4.1 Login Methods

Users can log in using:

- Email + Password
- Google account (OAuth)

### 4.2 Login Behavior

- If credentials are valid → user is redirected to the application.
- If credentials are invalid → appropriate error message is shown (as defined in Figma).
- If Google login is successful → user is authenticated and redirected accordingly.

---

## 5. Sign-Up Flow (Multi-Step Wizard)

The sign-up process is implemented as a multi-step onboarding wizard, strictly following the order and structure defined in Figma.

### Step 1 – Account Credentials

If user chooses:

- **Email + Password:**
  - Enter email
  - Enter password
  - Confirm password (if defined in Figma)
  
- **Google Sign-Up:**
  - This step is skipped
  - Email is retrieved from Google account

Validation:
- Email must be valid format
- Password must meet defined security requirements

---

### Step 2 – Personal Details

User enters basic personal information.

Fields (as defined in Figma):
- First Name
- Last Name
- Phone Number
- Any additional personal fields shown in design

All fields are standard input fields.

---

### Step 3 – Business Information

User enters business-related information.

Fields include (as defined in Figma):
- Business Name
- Business Address
- Company ID / Registration Number
- Tax Number (if applicable)
- Other business-related inputs from Figma

All fields are simple input fields with validation where required.

---

### Step 4 – Plan Selection & Subscription

The user selects a subscription plan.

#### Available Plans

1. Free Plan
2. Pro Plan (Monthly Subscription)

#### Plan Details

- Both plans are monthly subscriptions.
- The Pro plan requires payment.
- Payment processing is handled via Stripe.
- Subscription is recurring (monthly ongoing).

#### Payment Flow

If user selects:

- **Free Plan:**
  - No payment details required.
  - User proceeds to next step.

- **Pro Plan:**
  - User must enter:
    - Card number
    - Expiry date
    - CVC
    - Billing details (if required)
  - Payment is processed securely through Stripe.
  - On successful payment:
    - Subscription is activated.
  - On failure:
    - Error is displayed and user cannot proceed.

Stripe manages:
- Subscription lifecycle
- Recurring billing
- Payment authentication (including 3D Secure if required)

---

### Step 5 – Third-Party Integration

After selecting a plan, the user is prompted to connect third-party integrations.

#### Initial Integration

- DAT Integration (only integration available in Phase 1)

#### DAT Connection Flow

User must:

- Enter DAT credentials (e.g., username and password or API credentials, as defined)
- Save credentials

These credentials are stored securely and will later be used by the system to authenticate and retrieve data from DAT.

If connection validation is required:
- System attempts authentication
- Shows success or error message

---

### Step 6 – Onboarding Completion

Final screen confirms:

- Account setup completed
- Plan activated
- Integration connected (if required)

User can now:

- Proceed to Dashboard

---

## 6. Post-Authentication Routing Logic

After login:

- If onboarding is complete → Redirect to Dashboard
- If onboarding is incomplete → Redirect to the appropriate onboarding step

---

## 7. Technical Notes (Authentication & Subscriptions)

### Authentication
- Email/password authentication
- Google OAuth integration
- Secure password hashing
- Session management (JWT or secure session-based auth)

### Payments
- Stripe integration
- Recurring monthly subscription
- Webhooks for:
  - Successful payments
  - Failed payments
  - Subscription cancellation
  - Subscription updates

### Security
- Encrypted storage of third-party credentials
- HTTPS enforced
- Input validation on all forms
- Role-based access (future-ready)

---

# 8. Authenticated Application Overview

Once onboarding is completed and the user is authenticated, the user gains access to the main application.

Main application sections:

1. Dashboard (Home)
2. Analytics
3. Settings
   - Profile
   - Business Information
   - Integrations
   - Billing
   - Email Templates

Navigation structure and layout are implemented as defined in Figma.

---

# 9. Dashboard (Home)

## 9.1 Purpose

The Dashboard provides a high-level overview of:

- User financial performance
- Revenue summary
- Number of reports created
- Quick access to previously created reports

---

## 9.2 Financial Summary Section

The top section of the dashboard displays a financial overview.

### Time Filters

User can filter data by:
- Week
- Month
- Year

### Displayed Metrics

- Total Revenue (for selected period)
- Number of Payments
- Possibly number of reports created (if defined in Figma)

The financial data source:
- Likely retrieved from Stripe (TO BE DECIDED)
- If not Stripe, data will be calculated from internal payment records

---

## 9.3 Reports List

Below the financial summary, the user sees a table/list of all created reports.

### Reports Table Columns (as defined in Figma)

Each row represents one report and may include:

- Report ID
- Client Name
- Accident Date
- Report Status
- Invoice Status
- Report Value
- Creation Date
- Actions (View / Edit / Download / Send)

Exact columns are strictly aligned with Figma design.

### Behavior

- List is paginated (if required)
- Search functionality (if defined in Figma)
- Sorting by date, status, or value (if defined)

Clicking on a report opens the detailed report view.

---

# 10. Analytics Page

## 10.1 Purpose

The Analytics page provides detailed financial insights and earnings breakdown.

Data source:
- Most likely Stripe
- Marked as: **TO BE DECIDED**

---

## 10.2 Revenue Overview

User can see:

- Total revenue
- Revenue by month
- Revenue by year
- Revenue by custom time range (if defined in Figma)

Displayed using:

- Charts (line/bar charts as defined in Figma)
- Summary cards

---

## 10.3 Key Metrics

Metrics include:

- Total revenue
- Total number of reports
- Average report value (monthly basis)
- Number of paid vs unpaid invoices
- Payment success rate (if applicable)

---

## 10.4 Revenue Table

Detailed earnings table including:

- Client Name
- Invoice ID
- Payment Status (Paid / Pending / Failed)
- Amount Paid
- Date
- Payment Method (if available)
- Invoice link (if available)

Important:
This table represents the user’s revenue from their clients, not the platform subscription billing.

Data source:
- Stripe (if payments are processed through Stripe)
- Or internal database (TO BE DECIDED)

---

# 11. Settings Section

The Settings page allows the user to manage account-level configurations.

Subsections:

1. Profile
2. Business Information
3. Integrations
4. Billing
5. Email Templates

---

# 11.1 Profile Settings

## Purpose

Allows user to edit personal information entered during onboarding.

Editable fields:

- First Name
- Last Name
- Phone Number
- Email (if allowed)
- Password (change password flow)

Validation rules apply as during onboarding.

Changes are saved immediately or via "Save Changes" button (as defined in Figma).

---

# 11.2 Business Information

User can edit:

- Business Name
- Business Address
- Registration Number
- Tax ID
- Other business-related fields defined in onboarding

Changes affect:

- Future reports
- Invoice generation
- PDF reports

---

# 11.3 Integrations

## Purpose

Allows user to manage third-party integrations configured during onboarding.

### Phase 1 Integration

- DAT Integration

### Available Actions

- View current integration status
- Update credentials
- Reconnect
- Disconnect integration

Credentials are stored securely and encrypted.

If validation is required:
- System attempts authentication with DAT
- Displays success or error message

Future integrations may be added here.

---

# 11.4 Billing

## Purpose

Allows the user to manage their platform subscription (Free or Pro).

---

## Current Plan Display

User can see:

- Current Plan (Free / Pro)
- Monthly price
- Renewal date (if Pro)
- Subscription status (Active / Canceled / Past Due)

---

## Payment Method

User can:

- View current payment method
- Update card details
- Add new payment method

Handled via Stripe customer portal or Stripe API integration.

---

## Billing History

User can see:

- List of subscription invoices (platform billing)
- Each entry includes:
  - Invoice ID
  - Billing period
  - Amount
  - Status
  - Download invoice option (PDF if available)

Important:
This section reflects invoices the user pays to the platform,
not invoices issued to their clients.

Stripe manages:
- Recurring billing
- Invoice generation
- Subscription lifecycle
- Webhooks for billing updates

---

# 11.5 Email Templates

## Purpose

Allows user to create and manage email templates used when sending report PDFs to clients.

---

## Template Configuration

User can:

- Create template
- Edit template
- Delete template
- Set default template

Template fields:

- Email Subject
- Email Body (rich text or plain text editor)
- Dynamic placeholders (if supported), such as:
  - Client Name
  - Report ID
  - Accident Date
  - Report Amount
  - Business Name

Placeholders are replaced dynamically when sending email.

---

## Usage in Report Flow

When a report is completed:

- User can send report via email
- System:
  - Generates PDF
  - Attaches PDF
  - Uses selected email template
  - Sends to client email address

Email sending service:
- To be defined (e.g., SMTP, transactional email provider)

---

# 12. Role & Data Scope

Each authenticated user:

- Can only access their own:
  - Reports
  - Clients
  - Revenue data
  - Templates
  - Billing information

Multi-tenancy isolation is required at database level.

---

# 13. Report Creation – Overview

The report creation process is a multi-step wizard consisting of:

1. Gallery (Image Upload & AI Processing)
2. Report Details
   - Accident Info
   - Vehicle
   - Condition
   - Calculation
   - Invoice
3. Export & Send

At the end of the flow:

- A new Report entity is created and stored.
- The report becomes visible in the Dashboard report list.
- A PDF can be generated and sent via email.

---

# 14. Step 1 – Gallery (Image Upload & AI Processing)

## 14.1 Purpose

This step allows the user to upload photos of:

- Damaged vehicle (required)
- Driver’s license (optional)

---

## 14.2 Image Upload

User can:

- Upload multiple vehicle images
- Upload optional driver’s license image
- Delete uploaded images
- Rename image (edit file name)
- Add or edit image description

---

## 14.3 AI-Based Image Organization

After upload, the system automatically:

- Analyzes vehicle images
- Organizes them into logical order:
  - Front
  - Right side
  - Back
  - Left side
  - Additional angles (if applicable)

This ordering is done automatically using AI-based image recognition.

User may manually reorder images if needed (if supported in Figma).

---

## 14.4 AI Damage Detection & Annotation

For each uploaded vehicle image:

- The system automatically detects damaged areas using AI.
- The system draws visual markers:
  - Rectangle or circle shapes
  - Positioned around predicted damage areas

These shapes:

- Highlight detected damage
- Are editable by the user

---

## 14.5 Manual Editing of Annotations

User can:

- Resize shapes
- Move shapes
- Change shape type (rectangle / circle)
- Change shape color
- Add additional shapes
- Add arrows
- Delete shapes

This ensures the user can correct AI inaccuracies.

AI suggestions serve as an initial draft only.

---

## 14.6 Driver’s License Data Extraction (If Provided)

If a driver’s license image is uploaded:

The system automatically extracts:

- Vehicle Identification Number (VIN) (if present)
- Personal information (if visible and extractable)

Extracted data is:

- Stored temporarily
- Used to pre-populate relevant fields in later steps

All extracted information must be editable in subsequent steps.

---

# 15. Step 2 – Report Details

This section contains five sub-steps:

1. Accident Info
2. Vehicle
3. Condition
4. Calculation
5. Invoice

Important Principle:

All data that can be extracted automatically (from images or AI) must be pre-populated in the relevant fields.

User can always edit or override pre-filled values.

---

# 15.1 Accident Info

## Purpose

Collect all general accident-related information.

This includes (high-level only):

- Information about damaged vehicle owner
- Accident date and location
- Opponent information
- Visit details
- Expert opinion
- Accident characteristics
- Signatures (if applicable)

Important:

- Any data extracted from driver’s license or vehicle images must be pre-populated here where relevant.
- Fields remain fully editable.

Detailed field structure will be defined later.

---

# 15.2 Vehicle

## Purpose

Capture all vehicle-specific information.

This includes:

- Vehicle Identification Number (VIN)
- Manufacturer
- Model
- Type
- Engine specifications
- Horsepower
- Vehicle type
- Number of doors
- Number of seats
- Previous owners
- Technical specifications

AI Responsibilities:

- Extract VIN from images (if visible)
- Use VIN (if available) to auto-populate vehicle metadata (if external lookup is implemented)
- Pre-fill any information detectable from images

All fields remain editable by the user.

---

# 15.3 Condition

## Purpose

Describe the technical and visual condition of the damaged vehicle.

Includes:

- Drivable status
- Paint damage
- Interior condition notes
- Existing markers on vehicle
- Damage notes
- Previous damages
- Existing damages
- Detailed damage descriptions

---

## Visual Damage Mapping

This step includes:

- A car diagram
- Ability to place markers on specific areas of the car

User can:

- Add damage markers
- Describe each damage
- Indicate severity
- Specify paint damage
- Add tire information (size, profile, manufacturer)
- Add notes per damage location

AI Responsibilities:

- Use uploaded images and detected shapes to suggest:
  - Damage areas
  - Damage descriptions
- Pre-populate condition fields where possible

User can fully edit all data.

---

# 15.4 Calculation

## Purpose

Calculate estimated repair and loss values.

Includes:

- Vehicle value
- Repair cost
- Loss of use
- New vehicle value
- Total damage estimation

There are two calculation methods:

---

## Method 1 – AI-Based Estimation

The system uses:

- Uploaded images
- Detected damage areas
- Vehicle information
- Manual inputs from user

AI attempts to:

- Estimate repair cost
- Suggest total damage amount

This is an intelligent estimation layer.

---

## Method 2 – DAT Integration

If DAT integration is configured:

- User inputs required manual fields
- System sends data to DAT
- DAT returns official damage estimation

DAT is a third-party integration and does not use AI from this system.

User may choose which calculation method to use (as defined in Figma).

Detailed logic will be defined later.

---

# 15.5 Invoice

## Purpose

Generate invoice preview based on calculation results.

Includes:

- Invoice number
- Date
- List of repair items
- Itemized costs
- Total amount
- Associated images
- Vehicle and accident information

This step acts as a structured invoice preview before export.

Invoice data will later be included in the PDF.

---

# 16. Final Step – Export & Send

## 16.1 Purpose

Finalize report, generate PDF, and send via email.

---

## 16.2 PDF Generation

System generates a PDF document including:

- Selected sections of the report
- Images
- Annotations
- Accident information
- Vehicle information
- Condition details
- Calculation results
- Invoice

User can choose which sections to include in the PDF (configurable export).

Detailed configuration logic to be defined later.

---

## 16.3 Email Sending

User enters:

- Client email address
- Optional additional recipients
- Subject (pre-filled from template)
- Message (from selected email template)

System:

- Generates final PDF
- Attaches PDF
- Sends email to:
  - Client
  - The user (copy)

Email template system (defined in Phase 2) is used here.

---

# 17. Report Entity Creation

Upon completion:

- A new Report entity is created in the database.
- Report includes:
  - All entered data
  - Images
  - Annotations
  - Calculation results
  - Invoice
  - Export history

Report status may include:

- Draft
- Completed
- Sent

The created report:

- Appears in Dashboard list
- Can be reopened
- Can be edited (depending on status rules)
- Can be re-exported

---

