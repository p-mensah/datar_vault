
import React from 'react';
import { DocumentLedger, InvoiceData, DocumentStatus, RecurringStatus } from '../types';
import { TrashIcon, RecurringIcon } from './Icons';

interface DocumentLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: DocumentLedger;
  onLoad: (data: InvoiceData) => void;
  onDelete: (docNumber: string) => void;
  onStatusChange: (docNumber: string, status: DocumentStatus, amount?: number) => void;
}

const formatCurrency = (amount: number, currency: string) => {
  try {
    const locale = currency === 'GHS' ? 'en-GH' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    if (currency === 'GHS') {
      return formatted.replace(/GH₵/g, '₵').replace(/GHS/g, '₵');
    }
    return formatted;
  } catch (e) {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const formatDate = (dateString: string) => {
  try {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US');
  } catch (error) {
    return dateString;
  }
};

const StatusBadge: React.FC<{ status: DocumentStatus | RecurringStatus, isRecurring?: boolean }> = ({ status, isRecurring }) => {
    const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
    const statusClasses = {
        'Draft': 'bg-slate-100 text-slate-800',
        'Emailed': 'bg-blue-100 text-blue-800',
        'Paid': 'bg-green-100 text-green-800',
        'Partially Paid': 'bg-yellow-100 text-yellow-800',
        'Active': 'bg-green-100 text-green-800',
        'Ended': 'bg-slate-100 text-slate-800',
    };
    return <span className={`${baseClasses} ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>{status}</span>;
}

export const DocumentLedgerModal: React.FC<DocumentLedgerModalProps> = ({ isOpen, onClose, ledger, onLoad, onDelete, onStatusChange }) => {
  if (!isOpen) return null;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, doc: InvoiceData) => {
      const newStatus = e.target.value as DocumentStatus;
      if (newStatus === 'Partially Paid') {
          const amountStr = prompt(`Enter amount paid for ${doc.documentNumber}:`, doc.amountPaid.toString());
          if (amountStr !== null) {
              const amount = parseFloat(amountStr);
              if (!isNaN(amount)) {
                  onStatusChange(doc.documentNumber, newStatus, amount);
              } else {
                  alert('Invalid amount entered.');
              }
          }
      } else {
          onStatusChange(doc.documentNumber, newStatus);
      }
  };

  const ledgerEntries = Object.values(ledger).sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 no-print" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Document Ledger</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {ledgerEntries.length === 0 ? (<p className="text-slate-500 text-center py-8">Your document ledger is empty. Save a document to see it here.</p>) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Document</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {ledgerEntries.map(({ data, isRecurringTemplate }) => {
                    if (isRecurringTemplate) {
                        const settings = data.recurringSettings!;
                        return (
                             <tr key={data.documentNumber} className="hover:bg-slate-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-slate-900 flex items-center">
                                        <RecurringIcon className="h-4 w-4 mr-2 text-slate-500" />
                                        Recurring
                                    </div>
                                    <div className="text-xs text-slate-500 ml-6">{data.documentNumber}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{data.to.isBusiness ? data.to.businessName : data.to.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                                    <div>Frequency: <span className="font-medium text-slate-700 capitalize">{settings.frequency}</span></div>
                                    <div>Next due: <span className="font-medium text-slate-700">{settings.status === 'Active' ? formatDate(settings.nextDueDate!) : 'N/A'}</span></div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={settings.status!} isRecurring /></td>
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                  <button onClick={() => onLoad(data)} className="text-slate-600 hover:text-slate-900">Edit</button>
                                  <button onClick={() => onDelete(data.documentNumber)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-4 w-4"/></button>
                                </td>
                            </tr>
                        )
                    }
                    
                    const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
                    const taxAmount = (subtotal * data.taxRate) / 100;
                    const total = subtotal + taxAmount - data.discount;
                    const balanceDue = total - data.amountPaid;

                    return (
                      <tr key={data.documentNumber} className="hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-nowrap"><div className="text-sm font-semibold text-slate-900">{data.documentType}</div><div className="text-xs text-slate-500">{data.documentNumber}</div></td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{data.to.isBusiness ? data.to.businessName : data.to.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div>Date: <span className="font-medium text-slate-700">{formatDate(data.issueDate)}</span></div>
                            <div>Total: <span className="font-medium text-slate-800">{formatCurrency(total, data.currency)}</span></div>
                            {data.status !== 'Paid' && <div>Due: <span className="font-medium text-red-600">{formatCurrency(balanceDue, data.currency)}</span></div>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                            <select value={data.status} onChange={(e) => handleStatusChange(e, data)} className="text-sm rounded-md border-slate-300 shadow-sm focus:border-slate-400 focus:ring-slate-400">
                                <option value="Draft">Draft</option>
                                <option value="Emailed">Emailed</option>
                                <option value="Partially Paid">Partially Paid</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button onClick={() => onLoad(data)} className="text-slate-600 hover:text-slate-900">Load</button>
                          <button onClick={() => onDelete(data.documentNumber)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-4 w-4"/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
