# Suite 02: Dashboard & Navigation

## Prerequisites
- Logged in as `ivanvukasino+2@gmail.com`

---

## 2.1 Dashboard (`/dashboard`)
- [ ] Page loads with "Dashboard" heading
- [ ] **Revenue Card**: green gradient, shows total revenue (e.g. "$5,430.50")
- [ ] Revenue chart: bar chart with period tabs (Weekly, Monthly, Yearly)
- [ ] Period selector changes chart data
- [ ] Stats row below chart: "Completed Reports", "Pending Reports", "Delayed Payments"
- [ ] **Recent Reports** section heading with info icon
- [ ] Search input: magnifying glass icon, placeholder "Search..."
- [ ] Filter button (funnel icon)
- [ ] "+ New Report" green button (right side)
- [ ] **Report table** columns: Report, Report Number, Registration No., Date Created, Car Model, Report Type badge, Status
- [ ] Report type badges: HS (green), KG (blue), BE (orange), OT (purple) — or similar color coding
- [ ] Status indicators: "Saved - Draft", "Completed", etc.
- [ ] Pagination at bottom (if >10 reports)
- [ ] **Empty state**: if no reports, show empty illustration + "Create your first report" CTA
- [ ] No console errors
- **Figma:** `design/Home/Home.png`, `design/Home/Home v2.png`

## 2.2 Create New Report
- [ ] Click "+ New Report" → type selector dropdown/modal appears
- [ ] Options: Liability (HS), Short Report (KG), Evaluation (BE), Oldtimer Valuation (OT)
- [ ] Select "Liability" → creates report, navigates to `/reports/:id/gallery`
- [ ] Report title shows "Upload Images" or "Create New Report" with HS badge
- [ ] Back button "Go Back" → returns to dashboard
- **Figma:** `design/Home/Home v2.png` (dropdown shown)

## 2.3 Delete Report
- [ ] Right-click or 3-dot menu on report row → "Delete" option
- [ ] Click Delete → confirmation or immediate delete
- [ ] Report removed from list
- [ ] Toast or confirmation shown

## 2.4 Search Reports
- [ ] Type in search → filters report list in real-time
- [ ] Clear search → full list restores
- [ ] Search with no matches → empty state

## 2.5 Top Navigation Bar (all pages)
- [ ] **Logo** (left): "Gut8erPRO" — clickable, goes to `/dashboard`
- [ ] **Dashboard button**: green pill, "Dashboard" text
- [ ] **Stats icon** (chart): navigates to `/statistics`
- [ ] **Settings icon** (gear): navigates to `/settings`
- [ ] **Notification bell**: navigates to `/notifications`, shows unread count badge
- [ ] **User section** (right): avatar circle + name + role/plan
- [ ] Click user → dropdown: Profile, Settings, Analytics, Lock Report (in report), Logout

## 2.6 Notifications (`/notifications`)
- [ ] Page heading with unread count badge (e.g. "3")
- [ ] "Mark all as read" button (top right)
- [ ] Notification list items with:
  - Icon (varies by type: file, checkmark, lock, credit card)
  - Title (e.g. "Report completed", "Invoice generated")
  - Description text
  - Relative timestamp (e.g. "2 hours ago")
  - Blue dot for unread items
- [ ] Click notification → navigates to relevant report/section
- [ ] "Mark all as read" → all blue dots disappear
- [ ] Empty state if no notifications
- [ ] No console errors
- **Figma:** `design/Secondary/Notifications.png`

## 2.7 Statistics (`/statistics`)
- [ ] "Financial Analytics" heading with date range dropdown
- [ ] 4 stat cards in row: Total Revenue, Total Reports, Avg. Report Value, Completion Rate
- [ ] **Revenue Overview** chart: area/line chart with green fill
- [ ] Chart period tabs: Weekly, Monthly
- [ ] Y-axis labels (€ amounts), X-axis labels (months)
- [ ] **Analysis History** table below:
  - Columns: Client (avatar + name), Invoice ID, Date Created, Amount (color-coded), Status badge, Download icon
  - Status badges: "Completed" (green), "Pending" (yellow), "Rejected" (red)
- [ ] Search + filter for table
- [ ] No console errors
- **Figma:** `design/Secondary/Analytics.png`
