"use client";

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function Footer() {
	const [email, setEmail] = useState('');
	const [subscribed, setSubscribed] = useState(false);

	const footerLinks = {
		homeowners: [
			{ id: 'fh_request', label: 'Request offers', href: '/request-offers' },
			{ id: 'fh_compare', label: 'Compare specialists', href: '/compare' },
			{ id: 'fh_how', label: 'How it works', href: '/how-it-works' },
			{ id: 'fh_faq', label: 'Frequently asked questions', href: '/faq' },
			{ id: 'fh_reviews', label: 'Reviews', href: '/reviews' },
		],
		professionals: [
			{ id: 'fp_become', label: 'Become a partner', href: '/partner' },
			{ id: 'fp_benefits', label: 'Benefits for realtors', href: '/benefits' },
			{ id: 'fp_contractors', label: 'Benefits for contractors', href: '/benefits' },
			{ id: 'fp_login', label: 'Log in as professional', href: '/login' },
			{ id: 'fp_rates', label: 'Rates', href: '/rates' },
		],
		diensten: [
			{ id: 'd_moving', label: 'Moving', href: '/services/moving' },
			{ id: 'd_renovation', label: 'Renovation', href: '/services/renovation' },
			{ id: 'd_photography', label: 'Photography', href: '/services/photography' },
			{ id: 'd_styling', label: 'Styling', href: '/services/styling' },
			{ id: 'd_all', label: 'All services', href: '/services' },
		],
		contact: [
			{ id: 'c_addr', label: 'Main Street 2', href: '#' },
			{ id: 'c_zip', label: '1234AB Amsterdam', href: '#' },
			{ id: 'c_email', label: 'info@celebritypersona.com', href: 'mailto:info@celebritypersona.com' },
			{ id: 'c_kvk', label: 'KVK: 12345678', href: '#' },
			{ id: 'c_support', label: 'Customer service', href: '/support' },
		],
	};

	const socialLinks = [
		{ id: 'social_x', name: 'X', icon: 'XMarkIcon', href: '#' },
		{ id: 'social_facebook', name: 'Facebook', icon: 'UserGroupIcon', href: '#' },
		{ id: 'social_linkedin', name: 'LinkedIn', icon: 'LinkIcon', href: '#' },
	];

	function handleSubscribe(e: React.FormEvent) {
		e.preventDefault();
		if (!email) return;
		// placeholder: in real app call API
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
									{subscribed ? 'Subscribed' : 'Subscribe'}
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
						<div className="flex items-start gap-3 mb-4">
							<div className="w-12 h-12 flex items-center justify-center rounded-full bg-card border border-border">
								<Icon name="SparklesIcon" size={20} className="text-gradient-gold" />
							</div>
							<div>
								<h4 className="font-playfair text-lg">CelebrityPersona</h4>
								<p className="text-sm text-muted-foreground mt-2">CelebrityPersona brings together celebrity styles, reviews and curated looks. Sign up now for free to take advantage of exclusive content.</p>
							</div>
						</div>

						<div className="flex items-center gap-3 mt-4">
							{socialLinks.map((s) => (
								<a key={s.id} href={s.href} aria-label={s.name} className="w-10 h-10 rounded-full flex items-center justify-center border border-border hover:bg-primary/10 transition-all">
									<Icon name={s.icon as any} size={16} className="text-muted-foreground hover:text-primary transition-colors" />
								</a>
							))}
						</div>
					</div>

					{/* Column 1: For homeowners */}
					<div className="md:col-span-1">
						<h5 className="text-xs uppercase tracking-wider text-gradient-gold mb-4 font-montserrat">For homeowners</h5>
						<div className="space-y-2">
							{footerLinks.homeowners.map((link) => (
								<Link key={link.id} href={link.href} className="block text-sm text-muted-foreground hover:text-card-foreground transition-colors">{link.label}</Link>
							))}
						</div>
					</div>

					{/* Column 2: For professionals */}
					<div className="md:col-span-1">
						<h5 className="text-xs uppercase tracking-wider text-gradient-rose mb-4 font-montserrat">For professionals</h5>
						<div className="space-y-2">
							{footerLinks.professionals.map((link) => (
								<Link key={link.id} href={link.href} className="block text-sm text-muted-foreground hover:text-card-foreground transition-colors">{link.label}</Link>
							))}
						</div>
					</div>

					{/* Column 3: Diensten */}
					<div className="md:col-span-1">
						<h5 className="text-xs uppercase tracking-wider text-accent mb-4 font-montserrat">Diensten</h5>
						<div className="space-y-2">
							{footerLinks.diensten.map((link) => (
								<Link key={link.id} href={link.href} className="block text-sm text-muted-foreground hover:text-card-foreground transition-colors">{link.label}</Link>
							))}
						</div>
					</div>

					{/* Column 4: Contact details */}
					<div className="md:col-span-1">
						<h5 className="text-xs uppercase tracking-wider text-accent mb-4 font-montserrat">Contact details</h5>
						<div className="space-y-2 text-sm text-muted-foreground">
							{footerLinks.contact.map((link) => (
								<div key={link.id} className="block">{link.label}</div>
							))}
						</div>
					</div>
				</div>

				{/* Bottom small */}
				<div className="mt-10 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
					<p className="text-sm text-muted-foreground">© 2026 CelebrityPersona. All rights reserved.</p>
					<div className="flex items-center gap-6">
						<Link href="#terms" className="text-sm text-muted-foreground hover:text-card-foreground">Terms of Policy</Link>
						<Link href="#privacy" className="text-sm text-muted-foreground hover:text-card-foreground">Privacy Policy</Link>
						<Link href="#cookie" className="text-sm text-muted-foreground hover:text-card-foreground">Cookie Policy</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
