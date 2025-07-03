import React from 'react';
import { Priority } from '../../types';
import { getPriorityColor } from '../../utils';

interface TagProps {
  label: string;
  variant?: 'priority' | 'default' | 'success' | 'warning' | 'danger';
  priority?: Priority;
  size?: 'sm' | 'md';
  className?: string;
}

const Tag: React.FC<TagProps> = ({ 
  label, 
  variant = 'default', 
  priority,
  size = 'md',
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';
  
  const variantClasses = {
    priority: priority ? getPriorityColor(priority) : 'bg-gray-100 text-gray-700 border-gray-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <span className={classes}>
      {label}
    </span>
  );
};

export default Tag; 