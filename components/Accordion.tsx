
import React, { useState, ReactNode } from 'react';
import { ChevronDownIcon } from './Icons';

interface AccordionProps {
  title: string;
  icon: React.ReactElement<{ className?: string }>;
  children?: ReactNode;
  defaultOpen?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-slate-50 transition"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <span className="text-slate-500 mr-3">{React.cloneElement(icon, { className: 'h-6 w-6' })}</span>
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        </div>
        <ChevronDownIcon className={`h-6 w-6 text-slate-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 border-t border-slate-200">
          {children}
        </div>
      )}
    </div>
  );
};
