
import React from 'react';
import { ContractVersion, InvoiceData } from '../types';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ContractVersion[];
  onLoadVersion: (data: InvoiceData) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, onClose, versions, onLoadVersion }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 no-print" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Contract Version History</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {versions.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No saved versions for this contract yet.</p>
          ) : (
            <ul className="space-y-3">
              {[...versions].reverse().map((version, index) => (
                <li key={version.savedAt} className="border rounded-lg p-3 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-800">Version {versions.length - index}</p>
                    <p className="text-sm text-slate-500">
                      Saved on: {new Date(version.savedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => onLoadVersion(version.data)}
                    className="py-1 px-4 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
                  >
                    Load
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-3 border-t bg-slate-50 text-right rounded-b-xl">
          <button onClick={onClose} className="py-2 px-4 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
