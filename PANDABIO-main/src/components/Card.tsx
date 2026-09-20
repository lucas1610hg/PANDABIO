import React from 'react';

interface CardProps {
  id?: string;
  className?: string;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  headerRight?: React.ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  id,
  className = '',
  icon,
  iconBg = 'bg-[#eaedff]',
  iconColor = 'text-[#3525cd]',
  title,
  subtitle,
  headerRight,
  headerClassName = 'pb-2',
  bodyClassName = '',
  footer,
  children,
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col justify-between bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60 ${className}`}
    >
      <div>
        <div className={`flex items-center justify-between ${headerClassName}`}>
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}
            >
              {icon}
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-bold text-[#131b2e] leading-tight">{title}</h4>
              {subtitle && <span className="text-[11px] text-[#464555]">{subtitle}</span>}
            </div>
          </div>
          {headerRight}
        </div>
        <div className={bodyClassName}>{children}</div>
      </div>
      {footer}
    </div>
  );
};
