import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';
import UserMenu from './UserMenu';

interface NavigationBarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onNavigate?: (path: string) => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: string;
  tooltip: string;
}

const NavigationBar = ({ user, onNavigate }: NavigationBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'Home',
      tooltip: 'View account overview and quick actions'
    },
    {
      label: 'Transactions',
      path: '/transactions',
      icon: 'List',
      tooltip: 'View transaction history and details'
    },
    {
      label: 'Transfer',
      path: '/money-transfer',
      icon: 'Send',
      tooltip: 'Send money to accounts'
    },
    {
      label: 'Profile',
      path: '/user-profile',
      icon: 'User',
      tooltip: 'Manage account settings'
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
      aria-label="MobileBankPro Home"
    >
      <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
        <Icon name="Landmark" size={24} color="white" />
      </div>
      <span className="text-xl font-semibold text-foreground hidden sm:block">
        TrustPay
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
                  title={item.tooltip}
                >
                  <Icon
                    name={item.icon}
                    size={20}
                    color={isActive(item.path) ? 'var(--color-primary)' : 'currentColor'}
                  />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 ml-auto">
            {!isMobile && user && <UserMenu user={user} />}
            
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
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {user && (
                <div className="border-t border-border p-4">
                  <UserMenu user={user} isMobile />
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