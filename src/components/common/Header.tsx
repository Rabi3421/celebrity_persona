"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      const target = event.target as Element;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
      if (!target.closest('.more-menu-container')) {
        setShowMore(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
    router.push('/homepage');
  };

  const handleUploadOutfit = () => {
    if (isAuthenticated && user) {
      router.push('/dashboard?section=uploads');
    } else {
      router.push('/login?redirect=/dashboard?section=uploads');
    }
    setIsMobileMenuOpen(false);
  };

  const getNavLinks = () => {
    const baseLinks = [
      { id: 'nav_profiles', label: 'Celebrity Profiles', href: '/celebrity-profiles' },
      { id: 'nav_fashion', label: 'Fashion Gallery', href: '/fashion-gallery' },
      { id: 'nav_movies', label: 'Movie Details', href: '/movie-details' },
      { id: 'nav_upcoming', label: 'Upcoming Movies', href: '/upcoming-movies' },
      { id: 'nav_news', label: 'Celebrity News', href: '/celebrity-news' },
      { id: 'nav_reviews', label: 'Movie Reviews', href: '/reviews' },
    ];

    if (isAuthenticated && user) {
      if (user.role === 'superadmin') {
        baseLinks.push({ id: 'nav_superadmin', label: 'SuperAdmin', href: '/superadmin' });
      } else if (user.role === 'admin') {
        baseLinks.push({ id: 'nav_admin', label: 'Admin', href: '/admin' });
      } else {
        baseLinks.push({ id: 'nav_dashboard', label: 'Dashboard', href: '/dashboard' });
      }
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  // Keep these as primary links in the header (logo still links home)
  const primaryOrder = ['nav_profiles', 'nav_fashion', 'nav_news'];
  const primaryLinks = primaryOrder
    .map((id) => navLinks.find((l) => l.id === id))
    .filter(Boolean);

  // Everything else goes into the More dropdown (including role links)
  const moreLinks = navLinks.filter((l) => !primaryOrder.includes(l.id));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-card py-4' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/homepage" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Icon name="SparklesIcon" size={20} className="text-black" />
          </div>
          <span className="font-playfair text-2xl font-bold text-white">
            CelebrityPersona
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {primaryLinks.map((link) => (
            <Link
              key={link?.id}
              href={link?.href ?? '/'}
              className={`relative text-sm font-medium transition-colors ${
                pathname === link?.href
                  ? 'text-primary' :'text-neutral-300 hover:text-white'
              }`}
            >
              {link?.label}
              {pathname === link?.href && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}

          {/* More dropdown for remaining links */}
          {moreLinks.length > 0 && (
            <div className="relative more-menu-container">
              <button
                onClick={() => setShowMore(!showMore)}
                className="relative text-sm font-medium text-neutral-300 hover:text-white flex items-center gap-2"
              >
                More
                <Icon name="ChevronDownIcon" size={14} className="text-neutral-300" />
              </button>

              {showMore && (
                <div className="absolute mt-2 right-0 w-48 glass-card rounded-2xl p-2 space-y-1">
                  {moreLinks.map((link) => (
                    <Link
                      key={link?.id}
                      href={link?.href ?? '/'}
                      onClick={() => setShowMore(false)}
                      className={`block px-3 py-2 text-sm ${pathname === link?.href ? 'text-primary' : 'text-neutral-300 hover:text-white'}`}
                    >
                      {link?.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Auth Buttons - Desktop */}
        {isAuthenticated && user ? (
          <div className="hidden md:flex items-center gap-3">
            {/* Upload Outfit button always visible for logged-in users */}
            <button
              onClick={handleUploadOutfit}
              className="bg-primary text-black px-5 py-2.5 rounded-full text-sm font-medium hover:glow-gold transition-all flex items-center gap-2"
            >
              <Icon name="ArrowUpTrayIcon" size={16} className="text-black" />
              Upload Outfit
            </button>
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 glass-card px-4 py-2.5 rounded-full hover:glow-gold transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span className="text-black font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-white">{user.name}</span>
                <Icon name="ChevronDownIcon" size={16} className="text-white" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 glass-card rounded-2xl p-2 space-y-1">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-neutral-400">{user.email}</p>
                    <p className="text-xs text-primary capitalize">{user.role}</p>
                  </div>
                  <Link
                    href={user.role === 'superadmin' ? '/superadmin' : user.role === 'admin' ? '/admin' : '/dashboard'}
                    onClick={() => setShowUserMenu(false)}
                    className="block px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="glass-card px-5 py-2.5 rounded-full text-sm font-medium text-white hover:text-primary transition-all"
            >
              Login
            </Link>
            <button
              onClick={handleUploadOutfit}
              className="bg-primary text-black px-5 py-2.5 rounded-full text-sm font-medium hover:glow-gold transition-all"
            >
              Upload Outfit
            </button>
          </div>
        )}

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden glass-card p-2 rounded-lg"
        >
          <Icon
            name={isMobileMenuOpen ? 'XMarkIcon' : 'Bars3Icon'}
            size={24}
            className="text-white"
          />
        </button>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-card mt-4 mx-6 rounded-2xl p-6 space-y-4">
          {navLinks?.map((link) => (
            <Link
              key={link?.id}
              href={link?.href ?? '/'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block text-base font-medium transition-colors ${
                pathname === link?.href
                  ? 'text-primary' :'text-neutral-300 hover:text-white'
              }`}
            >
              {link?.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/10 space-y-3">
              {isAuthenticated && user ? (
              <>
                <div className="px-3 py-2 bg-white/5 rounded-lg">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-neutral-400">{user.email}</p>
                  <p className="text-xs text-primary capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-center glass-card px-5 py-3 rounded-full text-sm font-medium text-error hover:bg-error/10 transition-all"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center glass-card px-5 py-3 rounded-full text-sm font-medium text-white hover:text-primary transition-all"
                >
                  Login
                </Link>
                <button
                  onClick={handleUploadOutfit}
                  className="block w-full text-center bg-primary text-black px-5 py-3 rounded-full text-sm font-medium hover:glow-gold transition-all"
                >
                  Upload Outfit
                </button>
              </>
            )}
          </div>
          {isAuthenticated && (
            <button
              onClick={handleUploadOutfit}
              className="w-full flex items-center justify-center gap-2 bg-primary text-black px-5 py-3 rounded-full font-medium"
            >
              <Icon name="ArrowUpTrayIcon" size={18} />
              <span>Upload Outfit</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}