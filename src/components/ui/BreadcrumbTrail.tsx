import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbTrailProps {
  items: BreadcrumbItem[];
  className?: string;
}

const BreadcrumbTrail = ({ items, className = '' }: BreadcrumbTrailProps) => {
  const navigate = useNavigate();

  const handleClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, path?: string) => {
    if ((event.key === 'Enter' || event.key === ' ') && path) {
      event.preventDefault();
      navigate(path);
    }
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 text-sm ${className}`}
    >
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = !isLast && item.path;

          return (
            <li key={index} className="flex items-center gap-2">
              {isClickable ? (
                <button
                  onClick={() => handleClick(item.path)}
                  onKeyDown={(e) => handleKeyDown(e, item.path)}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring rounded-sm px-1"
                  aria-label={`Navigate to ${item.label}`}
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={`${
                    isLast
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  } px-1`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}

              {!isLast && (
                <Icon
                  name="ChevronRight"
                  size={16}
                  color="var(--color-muted-foreground)"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BreadcrumbTrail;