import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../AppIcon';
import UserMenu from './UserMenu';
import LanguageSelector from '../LanguageSelector';
import { API_BASE_URL, getStoredToken } from '../../utils/api';

interface NavigationBarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onNavigate?: (path: string) => void;
}

interface NavItem {
  labelKey: string;
  path: string;
  icon: string;
  tooltipKey: string;
}

const NavigationBar = ({ user, onNavigate }: NavigationBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [resolvedUser, setResolvedUser] = useState(user);

  const getDisplayName = (u?: { name?: string; fullName?: string; email?: string }) => {
    if (!u) return '';
    if (u.name && u.name.trim().length > 0) return u.name;
    if ((u as any).fullName && String((u as any).fullName).trim().length > 0) return (u as any).fullName;
    if (u.email) {
      const [local] = u.email.split('@');
      return local || u.email;
    }
    return '';
  };

  const navItems: NavItem[] = [
    {
      labelKey: 'navigation.dashboard',
      path: '/dashboard',
      icon: 'Home',
      tooltipKey: 'tooltips.dashboard'
    },
    {
      labelKey: 'navigation.transactions',
      path: '/transactions',
      icon: 'List',
      tooltipKey: 'tooltips.transactions'
    },
    {
      labelKey: 'navigation.transfer',
      path: '/money-transfer',
      icon: 'Send',
      tooltipKey: 'tooltips.transfer'
    },
    {
      labelKey: 'navigation.profile',
      path: '/user-profile',
      icon: 'User',
      tooltipKey: 'tooltips.profile'
    }
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setResolvedUser(user);
  }, [user]);

  useEffect(() => {
    if (user) return;
    const token = getStoredToken();
    if (!token) return;
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    })
      .then((res) => res.json().then((payload) => ({ ok: res.ok, payload })).catch(() => ({ ok: res.ok, payload: null })))
      .then(({ ok, payload }) => {
        if (ok && payload) {
          const me = payload.user || payload;
          setResolvedUser({
            name: getDisplayName(me),
            email: me.email,
            avatar: me.avatarUrl
          });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setResolvedUser({
      name: getDisplayName(user),
      email: user.email,
      avatar: user.avatar
    });
  }, [user]);

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const Logo = () => (
    <button
      onClick={() => handleNavigation('/dashboard')}
      className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-md transition-all duration-200"
      aria-label={t('aria.home')}
    >
      <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
        <Icon name="Landmark" size={24} color="white" />
      </div>
      <span className="text-xl font-semibold text-foreground hidden sm:block">
        {t('brand.name')}
      </span>
    </button>
  );

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 h-nav-height bg-card border-b border-border shadow-nav z-nav"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="h-full px-nav-margin flex items-center justify-between">
          <Logo />

          {!isMobile && (
            <div className="flex items-center gap-1 ml-8">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md
                    text-nav font-medium transition-all duration-200 ease-out
                    hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring
                    ${
                      isActive(item.path)
                        ? 'text-primary bg-primary/10' :'text-muted-foreground hover:text-foreground'
                    }
                  `}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  title={t(item.tooltipKey)}
                >
                  <Icon
                    name={item.icon}
                    size={20}
                    color={isActive(item.path) ? 'var(--color-primary)' : 'currentColor'}
                  />
                  <span>{t(item.labelKey)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 ml-auto">
            {!isMobile && (
              <LanguageSelector variant="neutral" className="hidden md:inline-flex" />
            )}
            {!isMobile && resolvedUser && <UserMenu user={resolvedUser} />}
            
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring transition-colors duration-200"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                <Icon name={mobileMenuOpen ? 'X' : 'Menu'} size={24} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-dropdown animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        >
          <div
            className="fixed right-0 top-nav-height bottom-0 w-64 bg-card shadow-modal animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 py-4">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-6 py-3
                      text-nav font-medium transition-all duration-200
                      hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset
                      ${
                        isActive(item.path)
                          ? 'text-primary bg-primary/10 border-l-4 border-primary' :'text-muted-foreground hover:text-foreground'
                      }
                    `}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                  >
                    <Icon
                      name={item.icon}
                      size={20}
                      color={isActive(item.path) ? 'var(--color-primary)' : 'currentColor'}
                    />
                    <span>{t(item.labelKey)}</span>
                  </button>
                ))}
              </div>

              <div className="px-6 pb-3">
                <LanguageSelector variant="neutral" className="w-full" />
              </div>

              {resolvedUser && (
                <div className="border-t border-border p-4">
                  <UserMenu user={resolvedUser} isMobile />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavigationBar;
