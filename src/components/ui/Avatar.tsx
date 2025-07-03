import React from 'react';
import { getInitials, getRandomColor } from '../../utils';

interface AvatarProps {
  user: {
    name: string;
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

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${classes} object-cover`}
      />
    );
  }

  return (
    <div className={`${classes} ${getRandomColor()}`}>
      {getInitials(user.name)}
    </div>
  );
};

export default Avatar; 