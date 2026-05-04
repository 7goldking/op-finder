import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '@/api/auth';
import {
  Home, Compass, Sparkles, User as UserIcon, Briefcase, LogOut,
  ArrowLeft, Sun, Moon, GraduationCap, BookOpen, MessageCircle,
  Users, Search, Heart, Zap, ChevronLeft, ChevronRight,
  PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen
} from 'lucide-react';
import { MenuCloseIcon } from '@/components/ui/animated-state-icons';
import Logo from '@/components/Logo';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationBell from '@/components/NotificationBell';
import HeroFrame from '@/components/HeroFrame';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Top bar items (always visible in header)
const TOP_NAV_KEYS = ['home', 'catalog', 'assistant'];
// Sidebar items
const SIDE_NAV_KEYS = ['search', 'activity', 'mentors', 'blog', 'teams', 'chat', 'friend-requests', 'dashboard'];

const SIDEBAR_SIDE_KEY = 'opfinder_sidebar_side';
const SIDEBAR_OPEN_KEY = 'opfinder_sidebar_open';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const { isDark, toggle: toggleTheme } = useTheme();
  const { t } = useI18n();

  // Sidebar state
  const [sidebarSide, setSidebarSide] = useState(() => localStorage.getItem(SIDEBAR_SIDE_KEY) || 'left');
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem(SIDEBAR_OPEN_KEY) !== 'false');

  // Preserve last visited path for each bottom tab
  const tabPaths = useRef({});

  const toggleSide = () => {
    const next = sidebarSide === 'left' ? 'right' : 'left';
    setSidebarSide(next);
    localStorage.setItem(SIDEBAR_SIDE_KEY, next);
  };
  const toggleSidebar = () => {
    setSidebarOpen(v => {
      localStorage.setItem(SIDEBAR_OPEN_KEY, String(!v));
      return !v;
    });
  };

  const loadUser = () => {
    auth.me().then(u => {
      setUser(u);
      if (u && u.onboarded === false) navigate('/onboarding');
    }).catch(() => setUser(null));
  };

  useEffect(() => {
    loadUser();
    const onFocus = () => loadUser();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar_url]);

  // Listen for avatar updates from Profile page via custom event
  useEffect(() => {
    const handler = () => auth.me().then(u => { if (u) setUser(u); }).catch(() => {});
    window.addEventListener('user-updated', handler);
    return () => window.removeEventListener('user-updated', handler);
  }, []);

  const isOrg = user?.account_type === 'organization';
  const rootPaths = ['/', '/home', '/catalog', '/assistant', '/dashboard', '/org', '/mentors', '/blog'];
  const isRoot = rootPaths.includes(location.pathname);

  // Student top nav (shown in header)
  const studentTopNav = [
    { to: '/home', label: t('nav.home'), icon: Home },
    { to: '/catalog', label: t('nav.catalog'), icon: Compass },
    { to: '/assistant', label: t('nav.assistant'), icon: Sparkles },
  ];

  // Student sidebar nav
  const studentSideNav = [
    { to: '/search', label: t('nav.search'), icon: Search },
    { to: '/activity', label: t('nav.activity'), icon: Zap },
    { to: '/mentors', label: t('nav.mentors'), icon: GraduationCap },
    { to: '/blog', label: t('nav.blog'), icon: BookOpen },
    { to: '/teams', label: t('nav.teams'), icon: Users },
    { to: '/chat', label: t('nav.messages'), icon: MessageCircle },
    { to: '/friend-requests', label: t('nav.friend_requests'), icon: Heart },
    { to: '/submit', label: t('nav.submit'), icon: Sparkles },
    { to: '/dashboard', label: t('nav.dashboard'), icon: UserIcon },
  ];

  // Org nav stays in header
  const orgTopNav = [
    { to: '/org', label: t('nav.panel'), icon: Briefcase },
    { to: '/catalog', label: t('nav.catalog'), icon: Compass },
    { to: '/blog', label: t('nav.blog'), icon: BookOpen },
    { to: '/dashboard', label: t('nav.profile'), icon: UserIcon },
  ];
  const orgSideNav = [
    { to: '/mentors', label: t('nav.mentors'), icon: GraduationCap },
    { to: '/chat', label: t('nav.messages'), icon: MessageCircle },
    { to: '/search', label: t('nav.search'), icon: Search },
    { to: '/activity', label: t('nav.activity'), icon: Zap },
  ];

  const topNav = isOrg ? orgTopNav : studentTopNav;
  const sideNav = isOrg ? orgSideNav : studentSideNav;

  // Preserve last visited path per bottom tab
  useEffect(() => {
    const path = location.pathname;
    topNav.forEach(item => {
      if (path === item.to || (item.to !== '/' && path.startsWith(item.to))) {
        tabPaths.current[item.to] = path;
      }
    });
  }, [location.pathname]);
  // Mobile bottom nav = top + sidebar merged
  const allNav = isOrg ? orgTopNav : [...studentTopNav, ...studentSideNav];

  const logout = async () => {
    await auth.logout(window.location.origin + '/');
  };

  const isActive = (to) =>
    location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  // Group sidebar nav into sections
  const discoverNav = isOrg ? orgSideNav : studentSideNav.slice(0, 3); // search, activity, mentors
  const communityNav = isOrg ? [] : studentSideNav.slice(3, 6); // blog, teams, chat
  const personalNav = isOrg ? [] : studentSideNav.slice(6); // friend-requests, dashboard

  const SidebarSection = ({ label, items }) => {
    const labelMap = { discover: 'sidebar.discover', community: 'sidebar.community', personal: 'sidebar.personal' };
    const sectionLabel = labelMap[label] ? t(labelMap[label]) : label;
    return (
      <div className="mb-2">
        {label && <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">{sectionLabel}</p>}
        {items.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-3 px-2">
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
        <SidebarSection label="discover" items={discoverNav} />
        {communityNav.length > 0 && <SidebarSection label="community" items={communityNav} />}
        {personalNav.length > 0 && <SidebarSection label="personal" items={personalNav} />}
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-screen bg-background flex flex-col relative")}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-full px-4 md:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left: logo / back + sidebar toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sidebar toggle (desktop only) */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              title={sidebarOpen ? t('sidebar.hide') : t('sidebar.show')}
            >
              {sidebarOpen
                ? (sidebarSide === 'left' ? <PanelLeftClose className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />)
                : (sidebarSide === 'left' ? <PanelLeftOpen className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />)
              }
            </button>

            {!isRoot ? (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">{t('nav.back')}</span>
              </button>
            ) : (
              <Link to="/home" className="flex items-center gap-2">
                <Logo size={32} />
                <span className="font-display text-base font-semibold hidden sm:inline">Op-finder</span>
              </Link>
            )}
          </div>

          {/* Center: desktop top nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {topNav.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-full transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-secondary rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="hidden md:flex items-center gap-1.5">
                <LanguageSwitcher />
                {!isOrg && <NotificationBell userEmail={user.email} />}
                {/* Sidebar side switch */}
                <button
                  onClick={toggleSide}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  title={sidebarSide === 'left' ? t('sidebar.move_right') : t('sidebar.move_left')}
                >
                  {sidebarSide === 'left'
                    ? <ChevronRight className="w-4 h-4" />
                    : <ChevronLeft className="w-4 h-4" />
                  }
                </button>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full bg-secondary hover:bg-secondary/70 transition-colors"
                >
                  <span className="text-sm font-medium">{user.full_name?.split(' ')[0] || t('nav.greeting')}</span>
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold overflow-hidden">
                    {user.avatar_url && !avatarError ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                    ) : (
                      (user.full_name || user.email || '?')[0].toUpperCase()
                    )}
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="theme" title={isDark ? t('nav.theme_light') : t('nav.theme_dark')}>
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={logout} title={t('nav.logout')}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <LanguageSwitcher />
                <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="theme">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button onClick={() => auth.redirectToLogin(window.location.href)} className="rounded-full px-5">
                  {t('nav.login')}
                </Button>
              </div>
            )}
            <button
              aria-label="menu"
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <MenuCloseIcon size={20} active={mobileMenuOpen} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border/60"
            >
              <nav className="flex flex-col p-2">
                {allNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary text-sm font-medium"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
                <div className="px-2 py-2 border-t border-border/60 mt-2">
                  <LanguageSwitcher />
                </div>
                {user ? (
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary text-sm font-medium text-muted-foreground"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('nav.logout')}
                  </button>
                ) : (
                  <button
                    onClick={() => auth.redirectToLogin(window.location.href)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    {t('nav.login')}
                  </button>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && sidebarSide === 'left' && (
            <motion.aside
              key="sidebar-left"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="hidden md:block shrink-0 border-r border-border/60 bg-sidebar overflow-hidden sticky top-16 h-[calc(100vh-4rem)] self-start"
            >
              <div className="w-[220px]">
                <SidebarContent />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="flex-1 min-w-0 pb-mobile-nav md:pb-8 relative overflow-x-hidden">
          <HeroFrame />
          <Outlet context={{ user, setUser }} />
        </main>

        {/* Right sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && sidebarSide === 'right' && (
            <motion.aside
              key="sidebar-right"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="hidden md:block shrink-0 border-l border-border/60 bg-sidebar overflow-hidden sticky top-16 h-[calc(100vh-4rem)] self-start"
            >
              <div className="w-[220px]">
                <SidebarContent />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16 px-2">
          {topNav.slice(0, 5).map((item) => {
            const active = isActive(item.to);
            const dest = tabPaths.current[item.to] || item.to;
            return (
              <Link
                key={item.to}
                to={dest}
                aria-label={item.label}
                className={cn(
                  "flex flex-col items-center gap-1 flex-1 py-2 rounded-lg transition-colors active:scale-95",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
                <span className="text-xs font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
          {/* More button opens mobile menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "flex flex-col items-center gap-1 flex-1 py-2 rounded-lg transition-colors active:scale-95",
              mobileMenuOpen ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <MenuCloseIcon size={20} active={mobileMenuOpen} />
            <span className="text-xs font-medium tracking-wide">{t('sidebar.more')}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}