import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import LanguageSelector from '../../../components/LanguageSelector';
import { getStoredToken } from '../../../utils/api';

interface NavItem {
  labelKey: string;
  path: string;
  hash?: string;
}

const navItems: NavItem[] = [
  { labelKey: 'navigation.personal', path: '/' },
  { labelKey: 'navigation.investing', path: '/investWealthManagement' },
  { labelKey: 'navigation.business', path: '/business' },
  { labelKey: 'navigation.commercial', path: '/commercial-banking' },
  { labelKey: 'navigation.cib', path: '/commercial-banking', hash: 'cib' },
  { labelKey: 'navigation.about', path: '/about-trustpay' }
];

const Header: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const [hasToken, setHasToken] = useState<boolean>(false);

  useEffect(() => {
    const syncAuth = () => setHasToken(Boolean(getStoredToken()));
    syncAuth();
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  const handleNavigate = (item: NavItem) => {
    if (item.hash) {
      navigate(`${item.path}#${item.hash}`);
      return;
    }
    navigate(item.path);
  };

  const isActive = (item: NavItem) => {
    if (item.hash) {
      return location.pathname === item.path && location.hash === `#${item.hash}`;
    }
    return location.pathname === item.path;
  };

  return (
    <header className="sticky top-0 z-50 shadow-card">
      <div className="bg-[#d1202f] text-white">
        <div className="px-nav-margin">
          <div className="max-w-7xl mx-auto h-16 flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-md"
              aria-label={t('aria.home')}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 border border-white/25">
                <Icon name="Landmark" size={22} color="white" />
              </div>
              <div className="text-left">
                <p className="text-xs uppercase tracking-[0.2em] leading-none text-white/80">
                  {t('brand.name')}
                </p>
                <p className="text-xl font-semibold leading-tight tracking-tight">
                  {t('brand.product')}
                </p>
              </div>
            </button>

            <div className="ml-auto flex items-center gap-6">
              <LanguageSelector variant="primary" />
              <button
                onClick={() =>
                  handleNavigate({ labelKey: hasToken ? 'navigation.dashboard' : 'navigation.signOn', path: hasToken ? '/dashboard' : '/login' })
                }
                className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-white text-[#2f2a28] text-sm font-semibold shadow-md hover:shadow-lg transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <span>{hasToken ? t('actions.dashboard') : t('actions.signOn')}</span>
                <Icon name={hasToken ? 'Home' : 'LogIn'} size={16} color="#2f2a28" />
              </button>
            </div>
          </div>
        </div>
        <div className="h-[3px] bg-[#f6c33d]" aria-hidden="true" />
      </div>

      <div className="bg-[#f7f4f2] border-b border-[#ead6cb]">
        <div className="px-nav-margin">
          <div className="max-w-7xl mx-auto overflow-x-auto">
            <nav className="flex items-center gap-8 py-4 min-w-max text-[15px] font-medium text-[#4a3b39]">
              {navItems.map((item) => {
                const active = isActive(item);
                return (
                  <button
                    key={`${item.path}${item.hash ?? ''}`}
                    onClick={() => handleNavigate(item)}
                    className={`relative pb-2 whitespace-nowrap transition-colors ${
                      active ? 'text-[#2c2423] font-semibold' : 'hover:text-[#2c2423]'
                    } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d1202f]/60 rounded-sm`}
                    aria-current={active ? 'page' : undefined}
                  >
                    {t(item.labelKey)}
                    {active && (
                      <span className="absolute left-0 right-0 -bottom-1 h-[3px] bg-[#d1202f] rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
