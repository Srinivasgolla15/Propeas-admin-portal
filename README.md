# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


importance of each file :

✅ Root-Level Files
File Name	Purpose & Importance
index.tsx	Entry point of the React app. This is where the app is mounted to the DOM. Without this, the app will not start.
App.tsx	Root component that defines the main structure and routes of the app. All other pages and components are loaded from here.
index.html	HTML shell that contains the root <div id="root">. React injects the app here. Without it, nothing will render in the browser.
package.json	Contains metadata about the project and dependencies. Vital for running, installing, and building the project.
tsconfig.json	TypeScript configuration. Controls how TypeScript compiles your code. Missing this will break type-checking and development experience.
vite.config.ts	Configuration file for Vite (a fast build tool). Defines how the project should be served and built. Needed for dev server and production build.
.env.local	Stores environment variables (e.g. API keys). Useful for sensitive configuration. Missing this might break features relying on these values.
.gitignore	Tells Git which files/folders to ignore (like node_modules). Keeps repo clean. Missing this may cause clutter or security issues.
README.md	Project documentation. Helpful for developers to understand how to set up and use the project. Not essential but good practice.
metadata.json	Possibly used for internal tracking or documentation metadata. Depends on your specific use case.
types.ts	Stores shared TypeScript types (like enums or interfaces). Promotes code clarity and type safety.
constants.tsx	Central place for reusable constants (like colors, roles, URLs). Missing it can lead to repeated hardcoded values across code.
styles/global.css	Global CSS styles. Helps maintain consistent styling across the app. Missing it will affect appearance and layout.

✅ components/layout/ — Layout Components
File	Purpose
Sidebar.tsx	Defines the sidebar layout/navigation. Critical for navigation across the app. Without it, the user can't switch pages.
Header.tsx	Top bar of the app. Often includes user info, logout, theme toggle, etc.
MainAppLayout.tsx	Wraps pages with consistent sidebar + header layout. Ensures consistent UI.

✅ components/ui/ — Reusable UI Components
File	Purpose & Importance
ThemeToggle.tsx	Toggles between light/dark mode. Nice to have for user experience.
Card.tsx	A styled container component. Used to display content blocks like widgets. Keeps UI modular and clean.
Button.tsx	A reusable button component with consistent styles and behavior. Avoids repeated styling.
Table.tsx	Table component for listing data. Avoids repetitive table styling and logic.
Badge.tsx	Displays status/info labels (like "Verified", "Pending").
Modal.tsx	A pop-up/modal dialog box component. Helps display forms, alerts, etc. in a user-friendly way.
ProgressBar.tsx	Displays progress visually. Useful for visual feedback.
Input.tsx	Reusable input component with consistent styles/validation.

✅ components/charts/
File	Purpose & Importance
TrendIndicator.tsx	Displays up/down trend indicators (like revenue +5%). Enhances data visuals.

✅ components/auth/
File	Purpose & Importance
ProtectedRoute.tsx	Restricts route access based on user authentication. Prevents unauthorized users from viewing sensitive pages.

✅ pages/ — App Pages (Grouped by Feature)
File or Folder	Purpose & Importance
DashboardPage.tsx	Main landing page after login. Shows widgets, charts, and insights. Crucial for users to see system stats.
NotFoundPage.tsx	Displays a 404 error for undefined routes. Good for user experience.
pages/auth/LoginPage.tsx	Login screen. Without it, no authentication is possible.

📁 pages/clients/
File	Purpose
AllClientsPage.tsx	Lists all clients. Important for Admin/Manager to view user data.
AssignClientToAdminPage.tsx	Lets admins assign clients to team members. Crucial for workflow.
ClientSubscriptionsPage.tsx	View/manage subscription details of a client.

📁 pages/properties/
File	Purpose
PendingVerificationsPage.tsx	Admins review and approve pending property listings. Important for quality control.
VerifiedPropertiesPage.tsx	Displays properties that have passed verification. Useful for reporting.

📁 pages/finance/
File	Purpose
PaymentVerificationPage.tsx	Finance team checks and verifies payments. Vital for financial integrity.
BillingReportsPage.tsx	Shows detailed billing history/reports. Required for audits and tracking.
FinancePlaceholderPage.tsx	Temporary placeholder if finance-specific dashboard is under development.

📁 pages/social/
File	Purpose
SocialCausesPage.tsx	Lists company-backed social causes. Adds a CSR (Corporate Social Responsibility) dimension.
DonationDashboardPage.tsx	Tracks donation metrics. Adds transparency and motivation for social efforts.

✅ Missing Any of These?
If This is Missing...	What Happens
index.tsx	App won’t start. React has no entry point.
App.tsx	App won't render any routes or layout.
Any layout/ component	UI will break — pages won’t have consistent navigation or header.
package.json	Can't install dependencies or run app.
tsconfig.json	TypeScript won't know how to compile your files.
DashboardPage.tsx	The main admin page will be missing.
LoginPage.tsx	Users can’t log in — app security is compromised.
ProtectedRoute.tsx	Unauthorized users could access any page — huge security flaw.

