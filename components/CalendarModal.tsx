import React, { useMemo } from 'react';
import Calendar from 'react-calendar';
import { DocumentLedger, InvoiceData, DocumentType } from '../types';
import 'react-calendar/dist/Calendar.css';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: DocumentLedger;
}

interface DueDateItem {
  date: string;
  documentNumber: string;
  clientName: string;
  amount: number;
  currency: string;
  status: string;
  documentType: DocumentType;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, ledger }) => {
  const dueDates = useMemo(() => {
    const dates: { [key: string]: DueDateItem[] } = {};

    // Helper function to add due date
    const addDueDate = (dueDateStr: string, data: InvoiceData) => {
      const date = new Date(dueDateStr).toDateString();
      if (!dates[date]) dates[date] = [];
      const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
      const taxAmount = (subtotal * data.taxRate) / 100;
      const total = subtotal + taxAmount - data.discount;
      const clientName = data.to.isBusiness ? data.to.businessName : data.to.name;
      dates[date].push({
        date: dueDateStr,
        documentNumber: data.documentNumber,
        clientName,
        amount: total,
        currency: data.currency,
        status: data.status,
        documentType: data.documentType,
      });
    };

    Object.values(ledger).forEach(entry => {
      if (entry.isRecurringTemplate) {
        // Calculate future due dates for recurring
        const template = entry.data;
        if (template.recurringSettings?.status === 'Active' && template.recurringSettings.frequency) {
          const frequency = template.recurringSettings.frequency;
          let currentDate = new Date(template.recurringSettings.nextDueDate || template.dueDate);
          const endDate = template.recurringSettings.endDate ? new Date(template.recurringSettings.endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year ahead

          while (currentDate <= endDate) {
            addDueDate(currentDate.toISOString().split('T')[0], template);

            // Increment date based on frequency
            if (frequency === 'weekly') currentDate.setDate(currentDate.getDate() + 7);
            else if (frequency === 'monthly') currentDate.setMonth(currentDate.getMonth() + 1);
            else if (frequency === 'yearly') currentDate.setFullYear(currentDate.getFullYear() + 1);
          }
        }
      } else {
        // Non-recurring
        if (entry.data.documentType !== 'Receipt' && entry.data.documentType !== 'Contract / Agreement') {
          addDueDate(entry.data.dueDate, entry.data);
        }
      }
    });

    return dates;
  }, [ledger]);

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (e) {
      return `$${amount.toFixed(2)}`;
    }
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = date.toDateString();
      const items = dueDates[dateStr];
      if (items && items.length > 0) {
        return <div className="absolute bottom-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{items.length}</div>;
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = date.toDateString();
      const items = dueDates[dateStr];
      if (items && items.length > 0) {
        return 'has-due-dates';
      }
    }
    return null;
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toDateString();
    const items = dueDates[dateStr];
    if (items && items.length > 0) {
      // Could open a details modal or tooltip, but for now, just log or alert
      const details = items.map(item =>
        `${item.documentType} #${item.documentNumber} - ${item.clientName} - ${formatCurrency(item.amount, item.currency)} (${item.status})`
      ).join('\n');
      alert(`Due dates on ${date.toDateString()}:\n${details}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-800">Due Dates Calendar</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 text-2xl"
            >
              &times;
            </button>
          </div>
        </div>
        <div className="p-6">
          <Calendar
            onClickDay={handleDateClick}
            tileContent={tileContent}
            tileClassName={tileClassName}
            className="react-calendar-custom"
          />
          <style>{`
            .react-calendar-custom .has-due-dates {
              background-color: rgba(239, 68, 68, 0.1);
              border-radius: 4px;
            }
            .react-calendar-custom .react-calendar__tile {
              position: relative;
            }
            .react-calendar-custom .react-calendar__tile--active {
              background-color: #475569;
            }
          `}</style>
          <div className="mt-4 text-sm text-slate-600">
            Dates with due invoices are highlighted. Click on a date to view details.
          </div>
        </div>
      </div>
    </div>
  );
};