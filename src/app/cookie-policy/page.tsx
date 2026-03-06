import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import LegalPage from '@/components/common/LegalPage';

export const metadata: Metadata = {
	title: 'Cookie Policy – CelebrityPersona',
	description: 'Learn about how CelebrityPersona uses cookies and similar tracking technologies.',
};

const sections = [
	{
		id: 'what-are-cookies',
		title: 'What Are Cookies?',
		content: `Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit a website. They are widely used to make websites work more efficiently, to provide a better user experience, and to give website owners information about how their site is being used.

Cookies can be "session cookies" (which expire when you close your browser) or "persistent cookies" (which remain on your device for a set period or until you delete them). Some cookies are set by the website you are visiting ("first-party cookies") while others are set by third-party services operating on that site ("third-party cookies").`,
	},
	{
		id: 'how-we-use',
		title: 'How We Use Cookies',
		content: `CelebrityPersona uses cookies and similar technologies (such as local storage and session storage) for the following purposes:

Essential Cookies
These cookies are strictly necessary for the Platform to function. They enable core features such as security, authentication, and accessibility. You cannot opt out of these cookies as the Platform cannot function properly without them.

Functional Cookies
These cookies allow the Platform to remember your preferences and choices (such as your theme preference, saved filters, or language settings) to provide a more personalised experience.

Analytics Cookies
We use analytics tools to understand how visitors interact with the Platform — which pages are visited most, how long users stay, and where they navigate from. This helps us improve the Platform. All analytics data is aggregated and anonymised.

Authentication Tokens
We store authentication tokens (JWT / Firebase tokens) in your browser's local storage or cookies to keep you securely logged in across sessions. These are essential for account functionality.`,
	},
	{
		id: 'third-party',
		title: 'Third-Party Cookies',
		content: `Some cookies on CelebrityPersona are placed by third-party services that appear on our pages. These include:

• Firebase (Google) — Used for user authentication and session management. Google may place cookies related to its authentication services.
• Cloudinary — Used to deliver and optimise images. May place performance-related cookies.
• Analytics Providers — Aggregated, anonymised usage analytics.

These third parties have their own privacy and cookie policies, and we recommend you review them:
• Google Privacy Policy: policies.google.com/privacy
• Cloudinary Privacy Policy: cloudinary.com/privacy

We do not control third-party cookies and are not responsible for how those parties use the data they collect.`,
	},
	{
		id: 'managing',
		title: 'Managing & Disabling Cookies',
		content: `You have the right to decide whether to accept or reject cookies. You can manage your cookie preferences in the following ways:

Browser Settings
Most browsers allow you to view, block, or delete cookies through their settings. Instructions for common browsers:
• Chrome: Settings → Privacy and Security → Cookies and other site data
• Firefox: Settings → Privacy & Security → Cookies and Site Data
• Safari: Preferences → Privacy → Manage Website Data
• Edge: Settings → Cookies and site permissions

Please note that blocking essential cookies may impact the functionality of the Platform, including your ability to log in or stay logged in.

Opt-Out Tools
For analytics and advertising cookies, you may also use industry opt-out tools such as:
• Google Analytics Opt-out Browser Add-on: tools.google.com/dlpage/gaoptout`,
	},
	{
		id: 'cookie-list',
		title: 'Cookie Reference List',
		content: `Below is a summary of the main cookies used on CelebrityPersona:

Essential Cookies
• auth-token — Stores your authentication session token. Duration: Session / 30 days. Purpose: Keeps you logged in securely.
• refresh-token — Used to refresh your authentication session without requiring re-login. Duration: 30 days.
• __session — Firebase session cookie for authentication state management.

Functional Cookies
• theme-preference — Remembers your display preferences. Duration: 1 year.
• cp-dismissed-banners — Tracks dismissed notification banners. Duration: 90 days.

Analytics Cookies
• _ga — Google Analytics — Distinguishes unique users. Duration: 2 years.
• _ga_* — Google Analytics — Maintains session state. Duration: 2 years.

This list may be updated as the Platform evolves. We recommend checking this page periodically for the most current information.`,
	},
	{
		id: 'consent',
		title: 'Your Consent',
		content: `By continuing to use CelebrityPersona after being presented with a cookie notice, you consent to our use of cookies as described in this Cookie Policy.

Where applicable law requires explicit consent (such as under the EU ePrivacy Directive or GDPR), we will obtain your consent before placing non-essential cookies on your device. You can withdraw your consent at any time by adjusting your browser settings or contacting us directly.`,
	},
	{
		id: 'changes',
		title: 'Changes to This Cookie Policy',
		content: `We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our data practices. The "Last updated" date at the top of this page will be revised accordingly. We encourage you to review this page periodically to stay informed about our use of cookies.

For significant changes, we will provide a more prominent notice, such as an updated cookie consent banner or a notification to registered users.`,
	},
	{
		id: 'contact',
		title: 'Contact Us',
		content: `If you have any questions about our use of cookies or this Cookie Policy, please get in touch:

• Email: info@celebritypersona.com
• Address: Main Street 2, Amsterdam, Netherlands
• Website: www.celebritypersona.com

We aim to respond to all enquiries within 3 business days.`,
	},
];

export default function CookiePolicyPage() {
	return (
		<>
			<Header />
			<main className="min-h-screen bg-background pt-32">
				<LegalPage
					badge="Legal"
					title="Cookie Policy"
					subtitle="Last updated: 24 February 2026"
					description="This Cookie Policy explains what cookies are, how CelebrityPersona uses them, and the choices available to you regarding their use."
					sections={sections}
					accentColor="emerald"
				/>
			</main>
			<Footer />
		</>
	);
}
