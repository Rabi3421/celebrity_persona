"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

export default function Footer() {
	const [email, setEmail] = useState('');
	const [subscribed, setSubscribed] = useState(false);
	const router = useRouter();

	const footerLinks = {
		explore: [
			{ id: 'fe_home', label: 'Home', href: '/homepage' },
			{ id: 'fe_celebrities', label: 'Celebrity Profiles', href: '/celebrity-profiles' },
			{ id: 'fe_fashion', label: 'Fashion Gallery', href: '/fashion-gallery' },
			{ id: 'fe_news', label: 'Celebrity News', href: '/celebrity-news' },
			{ id: 'fe_movies', label: 'Upcoming Movies', href: '/upcoming-movies' },
			{ id: 'fe_reviews', label: 'Movie Reviews', href: '/reviews' },
			{ id: 'fe_api_docs', label: 'API Documentation', href: '/api-docs' },
			{ id: 'fe_api_pricing', label: 'API Pricing', href: '/api-pricing' },
		],
		account: [
			{ id: 'fa_login', label: 'Login', href: '/login' },
			{ id: 'fa_signup', label: 'Sign Up', href: '/signup' },
			{ id: 'fa_dashboard', label: 'My Dashboard', href: '/dashboard' },
			{ id: 'fa_reset', label: 'Reset Password', href: '/reset-password' },
		],
		legal: [
			{ id: 'fl_terms', label: 'Terms of Policy', href: '/terms' },
			{ id: 'fl_privacy', label: 'Privacy Policy', href: '/privacy' },
			{ id: 'fl_cookie', label: 'Cookie Policy', href: '/cookie-policy' },
		],
	};

	const socialLinks = [
		{ id: 'social_x', name: 'X / Twitter', icon: 'XMarkIcon', href: 'https://twitter.com' },
		{ id: 'social_facebook', name: 'Facebook', icon: 'UserGroupIcon', href: 'https://facebook.com' },
		{ id: 'social_linkedin', name: 'LinkedIn', icon: 'LinkIcon', href: 'https://linkedin.com' },
	];

	function handleNavClick(href: string) {
		window.scrollTo({ top: 0, behavior: 'smooth' });
		router.push(href);
	}

	function handleSubscribe(e: React.FormEvent) {
		e.preventDefault();
		if (!email) return;
		setSubscribed(true);
		setEmail('');
	}

	return (
		<footer className="bg-card text-card-foreground mt-24 border-t border-border">
			<div className="max-w-7xl mx-auto px-6 py-12">
				{/* Newsletter */}
				<div className="bg-card-foreground/3 border border-border rounded-lg p-8 mb-8">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div className="md:flex-1">
							<h3 className="text-xl font-semibold text-card-foreground">Sign up for our newsletter!</h3>
							<p className="text-sm text-muted-foreground">Stay up to date with tips, trends and offers about celebrities and fashion.</p>
						</div>

						<form onSubmit={handleSubscribe} className="w-full md:w-auto md:flex-1">
							<div className="flex gap-3">
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Enter your email address here"
									className="flex-1 bg-input border border-border rounded-lg px-4 py-3 placeholder:text-muted-foreground text-card-foreground focus:outline-none"
								/>
								<button type="submit" className="rounded-lg bg-primary text-card-foreground px-5 py-3 font-medium hover:glow-gold transition-all">
									{subscribed ? '✓ Subscribed!' : 'Subscribe'}
								</button>
							</div>
						</form>
					</div>
				</div>

				<div className="border-t border-border pt-10" />

				{/* Main columns */}
				<div className="grid grid-cols-1 md:grid-cols-6 gap-8 mt-8">
					{/* Left: logo + description */}
					<div className="md:col-span-2">
						<button
							onClick={() => handleNavClick('/homepage')}
							className="flex items-start gap-3 mb-4 text-left hover:opacity-80 transition-opacity"
						>
							<div className="w-12 h-12 flex items-center justify-center rounded-full bg-card border border-border flex-shrink-0">
								<Icon name="SparklesIcon" size={20} className="text-gradient-gold" />
							</div>
							<div>
								<h4 className="font-playfair text-lg">CelebrityPersona</h4>
								<p className="text-sm text-muted-foreground mt-2">CelebrityPersona brings together celebrity styles, reviews and curated looks. Sign up now for free to take advantage of exclusive content.</p>
							</div>
						</button>

						<div className="flex items-center gap-3 mt-4">
							{socialLinks.map((s) => (
								<a
									key={s.id}
									href={s.href}
									target="_blank"
									rel="noopener noreferrer"
									aria-label={s.name}
									className="w-10 h-10 rounded-full flex items-center justify-center border border-border hover:bg-primary/10 hover:border-primary/50 transition-all"
								>
									<Icon name={s.icon as any} size={16} className="text-muted-foreground hover:text-primary transition-colors" />
								</a>
							))}
						</div>
					</div>

					{/* Column 1: Explore */}
					<div className="md:col-span-1">
						<h5 className="text-xs uppercase tracking-wider text-gradient-gold mb-4 font-montserrat">Explore</h5>
						<div className="space-y-2">
							{footerLinks.explore.map((link) => (
								<button
									key={link.id}
									onClick={() => handleNavClick(link.href)}
									className="block text-sm text-muted-foreground hover:text-card-foreground transition-colors text-left w-full"
								>
									{link.label}
								</button>
							))}
						</div>
					</div>

					{/* Column 2: Account */}
					<div className="md:col-span-1">
						<h5 className="text-xs uppercase tracking-wider text-gradient-rose mb-4 font-montserrat">Account</h5>
						<div className="space-y-2">
							{footerLinks.account.map((link) => (
								<button
									key={link.id}
									onClick={() => handleNavClick(link.href)}
									className="block text-sm text-muted-foreground hover:text-card-foreground transition-colors text-left w-full"
								>
									{link.label}
								</button>
							))}
						</div>
					</div>

					{/* Column 3: Legal */}
					<div className="md:col-span-1">
						<h5 className="text-xs uppercase tracking-wider text-accent mb-4 font-montserrat">Legal</h5>
						<div className="space-y-2">
							{footerLinks.legal.map((link) => (
								<button
									key={link.id}
									onClick={() => handleNavClick(link.href)}
									className="block text-sm text-muted-foreground hover:text-card-foreground transition-colors text-left w-full"
								>
									{link.label}
								</button>
							))}
						</div>
					</div>

					{/* Column 4: Contact details */}
					<div className="md:col-span-1">
						<h5 className="text-xs uppercase tracking-wider text-accent mb-4 font-montserrat">Contact</h5>
						<div className="space-y-2 text-sm text-muted-foreground">
							<div className="flex items-start gap-2">
								<Icon name="MapPinIcon" size={14} className="mt-0.5 flex-shrink-0 text-primary/60" />
								<span>Main Street 2, Amsterdam</span>
							</div>
							<a
								href="mailto:info@celebritypersona.com"
								className="flex items-start gap-2 hover:text-card-foreground transition-colors"
							>
								<Icon name="EnvelopeIcon" size={14} className="mt-0.5 flex-shrink-0 text-primary/60" />
								<span>info@celebritypersona.com</span>
							</a>
							<button
								onClick={() => handleNavClick('/dashboard')}
								className="flex items-start gap-2 hover:text-card-foreground transition-colors text-left"
							>
								<Icon name="UserCircleIcon" size={14} className="mt-0.5 flex-shrink-0 text-primary/60" />
								<span>Customer Dashboard</span>
							</button>
						</div>
					</div>
				</div>

				{/* Bottom bar */}
				<div className="mt-10 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
					<p className="text-sm text-muted-foreground">© 2026 CelebrityPersona. All rights reserved.</p>
					<div className="flex items-center gap-6">
						{footerLinks.legal.map((link) => (
							<button
								key={link.id + '_bottom'}
								onClick={() => handleNavClick(link.href)}
								className="text-sm text-muted-foreground hover:text-card-foreground transition-colors"
							>
								{link.label}
							</button>
						))}
					</div>
				</div>
			</div>
		</footer>
	);
}
