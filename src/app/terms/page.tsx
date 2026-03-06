import type { Metadata } from 'next';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import LegalPage from '@/components/common/LegalPage';

export const metadata: Metadata = {
	title: 'Terms of Policy – CelebrityPersona',
	description: 'Read the Terms of Policy for CelebrityPersona. Understand your rights, responsibilities, and how our platform works.',
};

const sections = [
	{
		id: 'acceptance',
		title: 'Acceptance of Terms',
		content: `By accessing or using CelebrityPersona ("the Platform"), you agree to be bound by these Terms of Policy. If you do not agree with any part of these terms, please do not use our services. These terms apply to all visitors, users, and others who access or use the Platform.

We reserve the right to update or change these terms at any time. We will notify registered users of significant changes via email or an in-app notification. Continued use of the Platform after any changes constitutes your acceptance of the new terms.`,
	},
	{
		id: 'eligibility',
		title: 'Eligibility & Account Registration',
		content: `You must be at least 13 years of age to use CelebrityPersona. If you are under 18, you represent that you have obtained parental or guardian consent. To access certain features you must register for an account.

When creating an account you agree to:
• Provide accurate, current, and complete information.
• Maintain the security of your password and accept responsibility for all activity under your account.
• Notify us immediately of any unauthorised use of your account.
• Not create accounts for the purpose of abusing features or violating these terms.

We reserve the right to suspend or terminate accounts that violate these conditions.`,
	},
	{
		id: 'content',
		title: 'User-Generated Content',
		content: `CelebrityPersona allows users to upload outfits, post reviews, like and save articles, and comment on content. By submitting any content ("User Content") you grant CelebrityPersona a non-exclusive, worldwide, royalty-free license to use, display, reproduce, and distribute your content on the Platform.

You are solely responsible for your User Content and represent that:
• You own or have the necessary rights to the content you submit.
• Your content does not infringe on any third-party intellectual property rights.
• Your content does not contain defamatory, obscene, or unlawful material.

We reserve the right to remove any User Content that violates these terms without prior notice.`,
	},
	{
		id: 'intellectual',
		title: 'Intellectual Property',
		content: `All content created and provided by CelebrityPersona — including but not limited to text, graphics, logos, icons, images, audio clips, and software — is the property of CelebrityPersona or its content suppliers and is protected by applicable intellectual property laws.

You may not copy, reproduce, distribute, or create derivative works from our content without express written permission. The CelebrityPersona name, logo, and all related product and service names, design marks, and slogans are trademarks of CelebrityPersona.`,
	},
	{
		id: 'prohibited',
		title: 'Prohibited Activities',
		content: `You agree not to engage in any of the following activities:
• Using the Platform for any unlawful purpose or in violation of these terms.
• Attempting to gain unauthorised access to any part of the Platform or its related systems.
• Transmitting any worms, viruses, or any code of a destructive nature.
• Scraping, crawling, or using automated means to access the Platform without prior written consent.
• Harassing, threatening, or impersonating other users or third parties.
• Using the Platform to send unsolicited commercial messages (spam).
• Posting content that is hateful, discriminatory, or incites violence.

Violation of these prohibitions may result in immediate termination of your account and, where appropriate, referral to law enforcement.`,
	},
	{
		id: 'disclaimers',
		title: 'Disclaimers & Limitation of Liability',
		content: `CelebrityPersona is provided on an "as is" and "as available" basis without any warranties of any kind, either express or implied. We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components.

To the fullest extent permitted by applicable law, CelebrityPersona and its affiliates, officers, employees, agents, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Platform.

Our total liability to you for any claims arising under these terms shall not exceed the amount paid by you, if any, to CelebrityPersona in the twelve months preceding the claim.`,
	},
	{
		id: 'termination',
		title: 'Termination',
		content: `We may terminate or suspend your access to the Platform immediately, without prior notice or liability, for any reason, including if you breach these Terms of Policy. Upon termination, your right to use the Platform will immediately cease.

You may also terminate your account at any time by contacting us at info@celebritypersona.com. All provisions of these terms which by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.`,
	},
	{
		id: 'governing',
		title: 'Governing Law',
		content: `These Terms of Policy shall be governed and construed in accordance with the laws of the Netherlands, without regard to its conflict of law provisions. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts located in Amsterdam, Netherlands.

If any provision of these terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these terms will otherwise remain in full force and effect.`,
	},
	{
		id: 'contact',
		title: 'Contact Us',
		content: `If you have any questions about these Terms of Policy, please contact us:

• Email: info@celebritypersona.com
• Address: Main Street 2, Amsterdam, Netherlands
• Website: www.celebritypersona.com

We aim to respond to all enquiries within 3 business days.`,
	},
];

export default function TermsPage() {
	return (
		<>
			<Header />
			<main className="min-h-screen bg-background pt-32">
				<LegalPage
					badge="Legal"
					title="Terms of Policy"
					subtitle="Last updated: 24 February 2026"
					description="Please read these Terms of Policy carefully before using CelebrityPersona. By using our platform, you agree to be bound by these terms."
					sections={sections}
					accentColor="gold"
				/>
			</main>
			<Footer />
		</>
	);
}
