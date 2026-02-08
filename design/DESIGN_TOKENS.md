# Gut8erPRO Design Tokens

> Extracted from Figma designs and branding assets.
> Values are best-estimate from screenshots. Confirm exact hex values from Figma variables panel if needed.

---

## Colors

### Brand
- Primary (Light Green): #16A34A
- Primary Hover: #15803D
- Primary Light (tint / selected bg): #F0FDF4
- Primary Light Border: #BBF7D0
- Dark Green: #166534
- Gradient: linear-gradient(135deg, #166534 0%, #22C55E 100%)

### Neutrals
- Black: #1A1A1A
- White: #FFFFFF
- Grey 25 (lightest bg): #F7F8FA
- Grey 50 (borders, dividers): #D1D5DB
- Grey 100 (secondary text, icons): #6B7280

### Semantic
- Background: #FFFFFF
- Surface (cards, panels): #FFFFFF
- Surface Secondary (sidebar, form bg): #F7F8FA
- Text Primary: #1A1A1A
- Text Secondary: #6B7280
- Text Placeholder: #9CA3AF
- Border: #E5E7EB
- Border Focus: #16A34A
- Error: #EF4444
- Error Light: #FEF2F2
- Success: #16A34A
- Success Light: #F0FDF4
- Warning (paint >160µm): #EAB308
- Warning Orange (paint >300µm): #F97316
- Danger (paint >700µm): #EF4444
- Info Blue (paint >70µm): #3B82F6
- Info Green (paint >=70µm): #22C55E

### Invoice / Accent
- Invoice Banner Green: #16A34A
- Invoice Banner Gradient: linear-gradient(135deg, #15803D, #22C55E)

---

## Typography

- **Font Family:** Inter (primary), system-ui fallback
- **Logo Font:** Custom — "Gut8erPRO" (Gut8er in black, PRO in green)

| Token          | Size  | Weight | Line Height | Usage                              |
|----------------|-------|--------|-------------|------------------------------------|
| Display        | 36px  | 700    | 1.2         | Landing hero heading               |
| H1             | 28px  | 700    | 1.3         | Page titles (Create your account)  |
| H2             | 24px  | 700    | 1.3         | Section titles (Accident Overview) |
| H3             | 20px  | 600    | 1.4         | Sub-sections (Vehicle Value)       |
| H4             | 16px  | 600    | 1.4         | Card titles, form group labels     |
| Body           | 16px  | 400    | 1.5         | Default body text                  |
| Body Small     | 14px  | 400    | 1.5         | Form labels, secondary info        |
| Caption        | 12px  | 400    | 1.4         | Hints, timestamps, badge text      |
| Caption Bold   | 12px  | 600    | 1.4         | Tags, status labels                |
| Button Large   | 16px  | 600    | 1.0         | Primary CTA buttons                |
| Button Small   | 14px  | 500    | 1.0         | Secondary/outline buttons          |

---

## Spacing

| Token | Value | Usage                           |
|-------|-------|---------------------------------|
| 2xs   | 2px   | Inline icon gap                 |
| xs    | 4px   | Tight padding, tag internal     |
| sm    | 8px   | Input internal padding, gaps    |
| md    | 16px  | Standard section padding        |
| lg    | 24px  | Card padding, section gaps      |
| xl    | 32px  | Page horizontal padding         |
| 2xl   | 48px  | Major section vertical spacing  |
| 3xl   | 64px  | Page-level vertical spacing     |

---

## Border Radius

| Token | Value | Usage                                |
|-------|-------|--------------------------------------|
| xs    | 2px   | Tiny elements                        |
| sm    | 4px   | Tags, badges, small chips            |
| md    | 8px   | Input fields, cards, buttons         |
| lg    | 12px  | Large cards, modals                  |
| xl    | 16px  | Photo containers, feature cards      |
| 2xl   | 24px  | Sidebar panels                       |
| full  | 999px | Avatars, round buttons, pill shapes  |

---

## Shadows

| Token    | Value                              | Usage                       |
|----------|------------------------------------|-----------------------------|
| sm       | 0 1px 2px rgba(0,0,0,0.05)        | Subtle inputs, hover states |
| card     | 0 2px 8px rgba(0,0,0,0.08)        | Cards, panels               |
| dropdown | 0 4px 12px rgba(0,0,0,0.12)       | Dropdowns, tooltips         |
| modal    | 0 8px 24px rgba(0,0,0,0.16)       | Modals, signature dialog    |
| elevated | 0 12px 32px rgba(0,0,0,0.20)      | Floating action elements    |

---

## Iconography

- **Style:** Outlined, 1.5px stroke
- **Sizes:** 16px (inline), 20px (buttons/nav), 24px (section headers), 32px (feature cards)
- **Color:** Inherits text color or primary green for active states
- **Library suggestion:** Lucide React or Phosphor Icons (matches the outlined style seen in designs)

---

## Component-Specific Tokens

### Buttons
- Height Large: 48px
- Height Default: 40px
- Height Small: 32px
- Padding Horizontal: 24px
- Border Radius: 8px (md)
- Primary: bg #16A34A, text #FFFFFF, hover #15803D
- Secondary/Outline: bg transparent, border #E5E7EB, text #1A1A1A, hover bg #F7F8FA
- Danger/Remove: bg transparent, border #1A1A1A, text #1A1A1A

### Inputs
- Height: 44px
- Padding: 12px 16px
- Border: 1px solid #E5E7EB
- Border Radius: 8px
- Focus Border: 1px solid #16A34A
- Background: #FFFFFF
- Placeholder Color: #9CA3AF
- Label Font: 14px / 500
- Error Border: 1px solid #EF4444

### Cards
- Background: #FFFFFF
- Border: 1px solid #E5E7EB
- Border Radius: 12px
- Padding: 24px
- Shadow: card token

### Sidebar (Report Editor)
- Width: ~200px
- Background: #F7F8FA
- Border Radius: 16px
- Active Item: text #16A34A, font-weight 600
- Inactive Item: text #6B7280

### Tab Bar (Report Sections)
- Active Tab: bg #1A1A1A, text #FFFFFF, border-radius full
- Inactive Tab: bg transparent, text #6B7280
- Completion Badge: text after tab name (e.g., "3/4"), font-weight 500

### Progress Indicator (Signup Stepper)
- Step Circle Size: 32px
- Active: bg #16A34A, text #FFFFFF
- Completed: green checkmark icon
- Pending: bg #E5E7EB, text #6B7280
- Connector Line: 2px solid #E5E7EB (completed: #16A34A)

---

## Breakpoints (Web)

| Token  | Value   | Usage         |
|--------|---------|---------------|
| sm     | 640px   | Mobile        |
| md     | 768px   | Tablet        |
| lg     | 1024px  | Desktop small |
| xl     | 1280px  | Desktop       |
| 2xl    | 1536px  | Wide desktop  |

---

## Paint Thickness Color Scale (Vehicle Condition)

| Range      | Color   | Hex     |
|------------|---------|---------|
| < 70 µm   | Blue    | #3B82F6 |
| >= 70 µm  | Green   | #22C55E |
| > 160 µm  | Yellow  | #EAB308 |
| > 300 µm  | Orange  | #F97316 |
| > 700 µm  | Red     | #EF4444 |
