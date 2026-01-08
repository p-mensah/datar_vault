
import React, { useState } from 'react';
import { PrintIcon, SaveIcon, ResetIcon, DocumentIcon, ClipboardDocumentCheckIcon, EyeIcon, PencilIcon, EmailIcon, HistoryIcon, LedgerIcon, ImportIcon, ExportIcon, AddressBookIcon, PackageIcon, ChevronLeftIcon } from './Icons';
import { DocumentType, Notification } from '../types';

// Dashboard Header - Clean, minimal header for dashboard view
interface DashboardHeaderProps {
  onShowCloudSync: () => void;
  onShowAnalytics: () => void;
  onManageClients: () => void;
  onManageItems: () => void;
  onShowLedger: () => void;
  notifications: Notification[];
  onLoadDocument: (documentNumber: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onShowCloudSync, onShowAnalytics, onManageClients, onManageItems, onShowLedger,
  notifications, onLoadDocument
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Datar Vault</h1>
              <p className="text-sm text-slate-600">AI Document Generator</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative">
              <button
                title="Notifications"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length > 99 ? '99+' : notifications.length}
                  </span>
                )}
              </button>
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-md shadow-lg z-20">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="text-sm font-medium text-slate-900">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div
                          key={notification.id}
                          onClick={() => {
                            onLoadDocument(notification.documentNumber);
                            setIsNotificationOpen(false);
                          }}
                          className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {notification.type} - {notification.documentNumber}
                              </p>
                              <p className="text-sm text-slate-600">{notification.clientName}</p>
                              <p className="text-xs text-slate-500">
                                {notification.daysUntilDue < 0
                                  ? `Overdue by ${Math.abs(notification.daysUntilDue)} days`
                                  : notification.daysUntilDue === 0
                                    ? 'Due today'
                                    : `Due in ${notification.daysUntilDue} days`}
                              </p>
                            </div>
                            <div className="text-sm font-medium text-slate-900">
                              {notification.currency} {notification.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Access Buttons */}
            <button
              title="Cloud Sync"
              onClick={onShowCloudSync}
              className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3.75-3.75M12 16.5l3.75-3.75M12 21a9 9 0 100-18 9 9 0 000 18z" />
              </svg>
            </button>

            <button
              title="Analytics"
              onClick={onShowAnalytics}
              className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              </svg>
            </button>

            <button
              title="Manage Clients"
              onClick={onManageClients}
              className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <AddressBookIcon className="h-5 w-5" />
            </button>

            <button
              title="Manage Items"
              onClick={onManageItems}
              className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <PackageIcon className="h-5 w-5" />
            </button>

            <button
              title="Document Ledger"
              onClick={onShowLedger}
              className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <LedgerIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Form Header - Full-featured header for form editing
interface FormHeaderProps {
  documentType: DocumentType;
  documentNumber: string;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onShowHistory: () => void;
  hasHistory: boolean;
  onShowLedger: () => void;
  onSave: () => void;
  onEmail: () => void;
  onPrint: () => void;
  onReset: () => void;
  onBackToDashboard: () => void;
}

export const FormHeader: React.FC<FormHeaderProps> = ({
  documentType, documentNumber, isPreviewMode, onTogglePreview, onShowHistory,
  hasHistory, onShowLedger, onSave, onEmail, onPrint, onReset, onBackToDashboard
}) => {
  const handleSaveClick = () => {
    const message = documentType === DocumentType.Contract
      ? "This will save the current state as a new version of the contract and update the document ledger. Continue?"
      : "Are you sure you want to save this document to the ledger?";

    if (window.confirm(message)) {
      onSave();
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3">
        <div className="flex justify-between items-center">
          {/* Left side - Back button and document info */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToDashboard}
              className="flex items-center space-x-2 px-3 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            <div className="hidden sm:block">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <span>Dashboard</span>
                <ChevronLeftIcon className="h-3 w-3 rotate-180" />
                <span className="font-medium text-slate-800">{documentType} #{documentNumber}</span>
              </div>
            </div>
          </div>

          {/* Right side - Form actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onTogglePreview}
              className="flex items-center py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              {isPreviewMode ? <PencilIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              <span className="ml-2 hidden sm:inline">{isPreviewMode ? 'Edit' : 'Preview'}</span>
            </button>

            <button
              onClick={onShowLedger}
              className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              title="Document Ledger"
            >
              <LedgerIcon className="h-5 w-5" />
            </button>

            {documentType === DocumentType.Contract && hasHistory && (
              <button
                onClick={onShowHistory}
                className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                title="Version History"
              >
                <HistoryIcon className="h-5 w-5" />
              </button>
            )}

            <button
              onClick={handleSaveClick}
              className="flex items-center py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <SaveIcon className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline">Save</span>
            </button>

            <button
              onClick={onEmail}
              className="flex items-center py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <EmailIcon className="h-5 w-5" />
              <span className="ml-2 hidden sm:inline">Email</span>
            </button>

            <button
              onClick={onReset}
              className="flex items-center py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
            >
              <ResetIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={onPrint}
              className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 transition-colors"
            >
              <PrintIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Legacy Header - Keep for backward compatibility
interface HeaderProps {
  onPrint: () => void;
  onSave: () => void;
  onReset: () => void;
  onEmail: () => void;
  documentType: DocumentType;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onShowHistory: () => void;
  hasHistory: boolean;
  onShowLedger: () => void;
  onShowAnalytics: () => void;
  onShowCloudSync: () => void;
  onImport: () => void;
  onExport: () => void;
  onManageClients: () => void;
  onManageItems: () => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
  // This is kept for backward compatibility
  // New code should use DashboardHeader or FormHeader directly
  return <FormHeader {...props} onBackToDashboard={() => {}} documentNumber="" />;
};
