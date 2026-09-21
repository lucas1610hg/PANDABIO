import React, { useRef } from 'react';
import { useTrapFocus } from '../hooks/useTrapFocus';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  label?: string;
  titleId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  label,
  titleId,
  size = 'md',
  className = '',
  children,
  initialFocusRef,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useTrapFocus(panelRef, isOpen, onClose, initialFocusRef);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-fade ${className}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative w-full ${sizeClasses[size]} bg-white rounded-3xl shadow-2xl overflow-hidden border border-black/10 flex flex-col max-h-[90vh] outline-none animate-modal-scale`}
      >
        {children}
      </div>
    </div>
  );
};
