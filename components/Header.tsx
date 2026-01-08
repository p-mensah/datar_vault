
import React from 'react';
import { PrintIcon, SaveIcon, ResetIcon, DocumentIcon, ClipboardDocumentCheckIcon, EyeIcon, PencilIcon, EmailIcon, HistoryIcon, LedgerIcon, ImportIcon, ExportIcon, AddressBookIcon, PackageIcon } from './Icons';
import { DocumentType } from '../types';

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

export const Header: React.FC<HeaderProps> = ({
    onPrint, onSave, onReset, onEmail, documentType, isPreviewMode, onTogglePreview,
    onShowHistory, hasHistory, onShowLedger, onShowAnalytics, onShowCloudSync, onImport, onExport, onManageClients, onManageItems
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 flex justify-between items-center flex-wrap gap-y-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
                    <DocumentIcon className="h-7 w-7 mr-2 text-slate-600" />
                    Datar Vault
                </h1>
                <div className="flex items-center space-x-2 flex-wrap">
                     <button title="Cloud Sync" onClick={onShowCloudSync} className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3.75-3.75M12 16.5l3.75-3.75M12 21a9 9 0 100-18 9 9 0 000 18z" />
                         </svg>
                     </button>
                     <button title="Analytics" onClick={onShowAnalytics} className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                         </svg>
                     </button>
                     <button title="Manage Clients" onClick={onManageClients} className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50"><AddressBookIcon className="h-5 w-5" /></button>
                     <button title="Manage Items" onClick={onManageItems} className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50"><PackageIcon className="h-5 w-5" /></button>
                     <button title="Import Data" onClick={onImport} className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50"><ImportIcon className="h-5 w-5" /></button>
                     <button title="Export Data" onClick={onExport} className="p-2 border border-slate-300 rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50"><ExportIcon className="h-5 w-5" /></button>
                     
                     <span className="w-px h-6 bg-slate-300 mx-2"></span>

                     <button onClick={onTogglePreview} className="flex items-center py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                        {isPreviewMode ? <PencilIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                     </button>
                     <button onClick={onShowLedger} className="flex items-center py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                        <LedgerIcon className="h-5 w-5" />
                    </button>
                    {documentType === DocumentType.Contract && hasHistory && (
                        <button onClick={onShowHistory} className="flex items-center py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                            <HistoryIcon className="h-5 w-5" />
                        </button>
                    )}
                    <button onClick={handleSaveClick} className="flex items-center py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                        <SaveIcon className="h-5 w-5" />
                    </button>
                    <button onClick={onEmail} className="flex items-center py-2 px-3 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                        <EmailIcon className="h-5 w-5" />
                    </button>
                    <button onClick={onReset} className="flex items-center py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200">
                        <ResetIcon className="h-5 w-5 mr-2" />
                        Reset Form
                    </button>
                    <button onClick={onPrint} className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-800">
                        <PrintIcon className="h-5 w-5 mr-2" />
                        Print / PDF
                    </button>
                </div>
            </div>
        </header>
    );
};
