import React from 'react';
import { getInitials, getRandomColor } from '../../utils';

interface AvatarProps {
  user?: {
    name?: string;
    avatar?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const baseClasses = 'rounded-full flex items-center justify-center font-medium text-white';
  const classes = `${baseClasses} ${sizeClasses[size]} ${className}`;

  // Handle undefined or incomplete user object
  if (!user || !user.name) {
    return (
      <div className={`${classes} ${getRandomColor()} bg-gray-400`}>
        ?
      </div>
    );
  }

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${classes} object-cover`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const fallback = document.createElement('div');
            fallback.className = `${classes} ${getRandomColor()}`;
            fallback.textContent = getInitials(user.name || '');
            parent.appendChild(fallback);
          }
        }}
      />
    );
  }

  return (
    <div className={`${classes} ${getRandomColor()}`}>
      {getInitials(user.name || '')}
    </div>
  );
};

export default Avatar; 