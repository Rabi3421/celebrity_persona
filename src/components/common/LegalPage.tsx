'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

interface Section {
	id: string;
	title: string;
	content: string;
}

interface LegalPageProps {
	badge: string;
	title: string;
	subtitle: string;
	description: string;
	sections: Section[];
	accentColor?: 'gold' | 'rose' | 'emerald';
}

const accentStyles = {
	gold: {
		badge: 'bg-primary/10 text-primary border border-primary/30',
		titleGradient: 'text-gradient-gold',
		dot: 'bg-primary',
		activeBg: 'bg-primary/10 border-primary/30 text-primary',
		activeText: 'text-primary',
		icon: 'text-primary',
		sectionDot: 'bg-primary/70',
		tocHover: 'hover:text-primary',
		topBar: 'from-primary/20 via-transparent to-transparent',
	},
	rose: {
		badge: 'bg-secondary/10 text-secondary border border-secondary/30',
		titleGradient: 'text-gradient-rose',
		dot: 'bg-secondary',
		activeBg: 'bg-secondary/10 border-secondary/30 text-secondary',
		activeText: 'text-secondary',
		icon: 'text-secondary',
		sectionDot: 'bg-secondary/70',
		tocHover: 'hover:text-secondary',
		topBar: 'from-secondary/20 via-transparent to-transparent',
	},
	emerald: {
		badge: 'bg-accent/10 text-accent border border-accent/30',
		titleGradient: '',
		dot: 'bg-accent',
		activeBg: 'bg-accent/10 border-accent/30 text-accent',
		activeText: 'text-accent',
		icon: 'text-accent',
		sectionDot: 'bg-accent/70',
		tocHover: 'hover:text-accent',
		topBar: 'from-accent/20 via-transparent to-transparent',
	},
};

function renderContent(content: string) {
	const lines = content.split('\n');
	const elements: React.ReactNode[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		// Blank line
		if (line.trim() === '') {
			i++;
			continue;
		}

		// Heading-like lines (short, no bullet, followed by content)
		if (
			line.trim() !== '' &&
			!line.startsWith('•') &&
			line.length < 60 &&
			i + 1 < lines.length &&
			lines[i + 1].trim() !== '' &&
			lines[i + 1].startsWith('•')
		) {
			elements.push(
				<p key={i} className="text-card-foreground font-semibold mt-5 mb-1">
					{line.trim()}
				</p>
			);
			i++;
			continue;
		}

		// Bullet points — collect consecutive bullets into a list
		if (line.startsWith('•')) {
			const bullets: string[] = [];
			while (i < lines.length && lines[i].startsWith('•')) {
				bullets.push(lines[i].slice(1).trim());
				i++;
			}
			elements.push(
				<ul key={`ul-${i}`} className="space-y-1.5 my-3 pl-1">
					{bullets.map((b, bi) => (
						<li key={bi} className="flex items-start gap-2.5 text-muted-foreground">
							<span className="mt-2 w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
							<span>{b}</span>
						</li>
					))}
				</ul>
			);
			continue;
		}

		// Regular paragraph line
		elements.push(
			<p key={i} className="text-muted-foreground leading-relaxed">
				{line.trim()}
			</p>
		);
		i++;
	}

	return <div className="space-y-2">{elements}</div>;
}

export default function LegalPage({
	badge,
	title,
	subtitle,
	description,
	sections,
	accentColor = 'gold',
}: LegalPageProps) {
	const [activeSection, setActiveSection] = useState<string | null>(null);
	const styles = accentStyles[accentColor];

	return (
		<div className="max-w-7xl mx-auto px-4 md:px-8 pb-24">
			{/* Hero Header */}
			<div className="relative mb-14">
				<div className={`absolute inset-x-0 top-0 h-40 bg-gradient-to-b ${styles.topBar} rounded-2xl blur-2xl opacity-40 pointer-events-none`} />
				<div className="relative text-center py-14 px-6 glass-card rounded-2xl border border-border">
					<span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5 ${styles.badge}`}>
						<Icon name="ShieldCheckIcon" size={13} />
						{badge}
					</span>
					<h1 className={`font-playfair text-4xl md:text-5xl font-bold mb-4 ${styles.titleGradient || 'text-card-foreground'}`}>
						{title}
					</h1>
					<p className="text-xs text-muted-foreground mb-4 tracking-wide uppercase">{subtitle}</p>
					<p className="max-w-2xl mx-auto text-muted-foreground leading-relaxed text-base md:text-lg">
						{description}
					</p>
					{/* Quick nav pills */}
					<div className="flex flex-wrap justify-center gap-2 mt-8">
						{sections.map((s) => (
							<button
								key={s.id}
								onClick={() => {
									document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
									setActiveSection(s.id);
								}}
								className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
									activeSection === s.id
										? styles.activeBg
										: 'border-border text-muted-foreground hover:border-border/80 hover:text-card-foreground'
								}`}
							>
								{s.title}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Body: TOC + Content */}
			<div className="flex flex-col lg:flex-row gap-10 items-start">
				{/* Sticky Table of Contents */}
				<aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 sticky top-28">
					<div className="glass-card rounded-xl border border-border p-5">
						<h3 className="text-xs uppercase tracking-widest font-semibold text-muted-foreground mb-4 flex items-center gap-2">
							<Icon name="ListBulletIcon" size={14} />
							Contents
						</h3>
						<nav className="space-y-0.5">
							{sections.map((s, idx) => (
								<button
									key={s.id}
									onClick={() => {
										document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
										setActiveSection(s.id);
									}}
									className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all group ${
										activeSection === s.id
											? `${styles.activeBg} border`
											: `text-muted-foreground ${styles.tocHover} hover:bg-muted/30`
									}`}
								>
									<span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
										activeSection === s.id ? styles.activeBg : 'bg-muted/40 text-muted-foreground'
									}`}>
										{idx + 1}
									</span>
									<span className="leading-tight">{s.title}</span>
								</button>
							))}
						</nav>

						{/* Other legal pages */}
						<div className="mt-6 pt-5 border-t border-border">
							<p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Other Legal Pages</p>
							<div className="space-y-1">
								<Link href="/terms" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-card-foreground transition-colors py-1">
									<Icon name="DocumentTextIcon" size={12} />
									Terms of Policy
								</Link>
								<Link href="/privacy" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-card-foreground transition-colors py-1">
									<Icon name="ShieldCheckIcon" size={12} />
									Privacy Policy
								</Link>
								<Link href="/cookie-policy" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-card-foreground transition-colors py-1">
									<Icon name="CakeIcon" size={12} />
									Cookie Policy
								</Link>
							</div>
						</div>
					</div>
				</aside>

				{/* Main Content */}
				<div className="flex-1 min-w-0 space-y-6">
					{sections.map((section, idx) => (
						<div
							key={section.id}
							id={section.id}
							className="glass-card rounded-xl border border-border p-6 md:p-8 scroll-mt-32 transition-all hover:border-border/60"
						>
							<div className="flex items-start gap-4 mb-5">
								<div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold bg-muted/40 ${styles.activeText}`}>
									{idx + 1}
								</div>
								<h2 className="font-playfair text-xl md:text-2xl font-semibold text-card-foreground leading-tight pt-0.5">
									{section.title}
								</h2>
							</div>
							<div className="pl-12 text-sm md:text-base">
								{renderContent(section.content)}
							</div>
						</div>
					))}

					{/* Bottom contact banner */}
					<div className={`glass-card rounded-xl border border-border p-6 md:p-8 bg-gradient-to-r ${styles.topBar}`}>
						<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
							<div>
								<h3 className="font-playfair text-lg font-semibold text-card-foreground mb-1">Have a question?</h3>
								<p className="text-muted-foreground text-sm">Our team is happy to help with any queries about this policy.</p>
							</div>
							<a
								href="mailto:info@celebritypersona.com"
								className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground hover:glow-gold flex-shrink-0`}
							>
								<Icon name="EnvelopeIcon" size={15} />
								Contact Us
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
