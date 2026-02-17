import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

export default function Footer() {
  const footerLinks = {
    explore: [
      { id: 'footer_celebrities', label: 'Celebrities', href: '/celebrity-profiles' },
      { id: 'footer_fashion', label: 'Fashion', href: '/fashion-gallery' },
      { id: 'footer_movies', label: 'Movies', href: '/homepage#movies' },
      { id: 'footer_news', label: 'News', href: '/homepage#news' },
    ],
    community: [
      { id: 'footer_upload', label: 'Upload Outfit', href: '#upload' },
      { id: 'footer_reviews', label: 'Reviews', href: '#reviews' },
      { id: 'footer_trending', label: 'Trending', href: '#trending' },
    ],
    company: [
      { id: 'footer_about', label: 'About', href: '#about' },
      { id: 'footer_privacy', label: 'Privacy', href: '#privacy' },
      { id: 'footer_terms', label: 'Terms', href: '#terms' },
      { id: 'footer_contact', label: 'Contact', href: '#contact' },
    ],
  };

  const socialLinks = [
    { id: 'social_instagram', name: 'Instagram', icon: 'CameraIcon', href: '#' },
    { id: 'social_twitter', name: 'Twitter', icon: 'ChatBubbleLeftIcon', href: '#' },
    { id: 'social_facebook', name: 'Facebook', icon: 'UserGroupIcon', href: '#' },
  ];

  return (
    <footer className="glass-card mt-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Top Row - Link Groups */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Explore */}
          <div>
            <h3 className="font-montserrat text-xs uppercase tracking-wider text-primary mb-4">
              Explore
            </h3>
            <div className="space-y-3">
              {footerLinks.explore.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="block text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-montserrat text-xs uppercase tracking-wider text-secondary mb-4">
              Community
            </h3>
            <div className="space-y-3">
              {footerLinks.community.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="block text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-montserrat text-xs uppercase tracking-wider text-accent mb-4">
              Company
            </h3>
            <div className="space-y-3">
              {footerLinks.company.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  className="block text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row - Social & Copyright */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.id}
                href={social.href}
                aria-label={social.name}
                className="glass-card p-2 rounded-lg hover:glow-gold transition-all"
              >
                <Icon name={social.icon as any} size={20} className="text-neutral-400 hover:text-white transition-colors" />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-sm text-neutral-500">
            © 2026 CelebrityPersona. All rights reserved.
          </p>

          {/* Legal Links */}
          <div className="flex items-center gap-6">
            <Link href="#privacy" className="text-sm text-neutral-500 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#terms" className="text-sm text-neutral-500 hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}