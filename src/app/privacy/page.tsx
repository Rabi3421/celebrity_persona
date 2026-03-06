import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import LegalPage from '@/components/common/LegalPage';

export const metadata: Metadata = {
	title: 'Privacy Policy – CelebrityPersona',
	description: 'Learn how CelebrityPersona collects, uses, and protects your personal data.',
};

const sections = [
	{
		id: 'overview',
		title: 'Overview',
		content: `CelebrityPersona ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, who we share it with, and the choices you have regarding your data.

This policy applies to all services offered through CelebrityPersona, including our website and any associated mobile applications. By using our Platform, you consent to the data practices described in this policy.`,
	},
	{
		id: 'data-collected',
		title: 'Data We Collect',
		content: `We collect different types of information in connection with your use of the Platform:

Account Information
• Name, email address, and password when you register.
• Profile information such as your avatar and display name.
• Authentication tokens (stored securely via Firebase Authentication).

Content & Activity Data
• Outfits you upload, reviews you write, and articles you like or save.
• Comments and interactions you make on the Platform.
• Search queries and browsing history within the Platform.

Technical Data
• IP address, browser type, operating system, and device identifiers.
• Pages visited, time spent on pages, and referral URLs.
• Cookies and similar tracking technologies (see our Cookie Policy).

Payment Data
• We do not currently process payments. If this changes, payment data will be handled by a certified third-party payment processor and will not be stored on our servers.`,
	},
	{
		id: 'how-we-use',
		title: 'How We Use Your Data',
		content: `We use the information we collect to:
• Create and manage your account and personalise your experience.
• Display and deliver the content and features of the Platform.
• Send you newsletter emails and platform updates (only if you opt in).
• Respond to your enquiries and provide customer support.
• Detect, investigate, and prevent fraudulent or abusive activity.
• Analyse usage patterns to improve Platform performance and features.
• Comply with legal obligations.

We will never sell your personal data to third parties for their marketing purposes.`,
	},
	{
		id: 'data-sharing',
		title: 'Data Sharing & Third Parties',
		content: `We may share your data with trusted third-party service providers who assist us in operating the Platform, including:

• Firebase (Google) — Authentication, real-time database, and storage services.
• MongoDB Atlas — Secure cloud database hosting for application data.
• Cloudinary — Image hosting and optimisation for uploaded content.
• Vercel / Hosting Provider — Website deployment and performance.

All third-party providers are contractually obligated to keep your information confidential and use it only to provide services on our behalf.

We may also disclose your information if required by law, court order, or governmental authority, or to protect the safety and security of our users and the Platform.`,
	},
	{
		id: 'data-retention',
		title: 'Data Retention',
		content: `We retain your personal data for as long as your account is active or as needed to provide you with our services. You may request deletion of your account and associated data at any time by contacting info@celebritypersona.com.

Following account deletion, we may retain certain data for a limited period as required by law or for legitimate business purposes (e.g., fraud prevention or resolving disputes). Anonymised or aggregated data that cannot identify you may be retained indefinitely for analytics purposes.`,
	},
	{
		id: 'your-rights',
		title: 'Your Rights',
		content: `Under applicable data protection laws (including the EU General Data Protection Regulation — GDPR), you have the following rights:

• Right of Access — Request a copy of the personal data we hold about you.
• Right to Rectification — Request correction of inaccurate or incomplete data.
• Right to Erasure — Request deletion of your personal data ("right to be forgotten").
• Right to Restriction — Request that we restrict processing of your data in certain circumstances.
• Right to Data Portability — Request your data in a structured, machine-readable format.
• Right to Object — Object to processing of your data based on legitimate interests.
• Right to Withdraw Consent — Withdraw consent at any time where processing is based on consent.

To exercise any of these rights, please contact us at info@celebritypersona.com. We will respond within 30 days.`,
	},
	{
		id: 'security',
		title: 'Data Security',
		content: `We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. These include:

• Encrypted passwords (never stored in plain text).
• HTTPS encryption for all data transmission.
• Role-based access controls limiting who can access user data internally.
• Regular security reviews and vulnerability assessments.

While we strive to protect your data, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password and to notify us immediately if you suspect any unauthorised access to your account.`,
	},
	{
		id: 'children',
		title: "Children's Privacy",
		content: `CelebrityPersona is not directed to children under the age of 13. We do not knowingly collect personal data from children under 13. If you believe we have inadvertently collected data from a child under 13, please contact us immediately at info@celebritypersona.com and we will take prompt steps to delete that information.`,
	},
	{
		id: 'changes',
		title: 'Changes to This Policy',
		content: `We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. For significant changes, we will notify registered users via email or a prominent notice on the Platform. We encourage you to review this policy periodically to stay informed about how we are protecting your data.`,
	},
	{
		id: 'contact',
		title: 'Contact Us',
		content: `If you have any questions, concerns, or requests regarding this Privacy Policy, please contact our Data Protection team:

• Email: info@celebritypersona.com
• Address: Main Street 2, Amsterdam, Netherlands
• Website: www.celebritypersona.com

We aim to respond to all data-related enquiries within 3 business days.`,
	},
];

export default function PrivacyPolicyPage() {
	return (
		<>
			<Header />
			<main className="min-h-screen bg-background pt-32">
				<LegalPage
					badge="Legal"
					title="Privacy Policy"
					subtitle="Last updated: 24 February 2026"
					description="Your privacy matters to us. This policy explains exactly what data we collect, how we use it, and the rights you have over your personal information."
					sections={sections}
					accentColor="rose"
				/>
			</main>
			<Footer />
		</>
	);
}
