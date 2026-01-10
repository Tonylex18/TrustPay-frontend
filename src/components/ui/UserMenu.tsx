import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Icon from '../AppIcon';
import Image from '../AppImage';
import { authEvents } from '../../utils/authEvents';

interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  isMobile?: boolean;
}

const UserMenu = ({ user, isMobile = false }: UserMenuProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleProfileClick = () => {
    navigate('/user-profile');
    setIsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRegistered');
    localStorage.removeItem('userRemember');
    authEvents.emitUnauthorized();
    toast.success('Signed out successfully.');
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {user.avatar ? (
              <Image src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <Icon name="User" size={20} color="var(--color-primary)" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Icon name="Settings" size={18} />
          <span>Settings</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Icon name="LogOut" size={18} />
          <span>Logout</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <Image src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <Icon name="User" size={16} color="var(--color-primary)" />
          )}
        </div>
        <span className="text-sm font-medium text-foreground hidden lg:block">{user.name}</span>
        <Icon
          name="ChevronDown"
          size={16}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-lg shadow-modal z-dropdown animate-fade-in">
          <div className="p-4 border-b border-border">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate mt-1">{user.email}</p>
          </div>

          <div className="py-2">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
            >
              <Icon name="Settings" size={18} />
              <span>Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
            >
              <Icon name="LogOut" size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
