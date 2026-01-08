import React, { useState, useMemo } from 'react';
import { DocumentLedger, InvoiceData, DocumentType, DocumentStatus, SavedClient, SavedItem } from '../types';

interface DashboardProps {
  ledger: DocumentLedger;
  savedClients: SavedClient[];
  savedItems: SavedItem[];
  onCreateNew: (documentType: DocumentType) => void;
  onLoadDocument: (data: InvoiceData) => void;
  onShowLedger: () => void;
  onShowAnalytics: () => void;
  onShowClients: () => void;
  onShowItems: () => void;
  onShowCloudSync: () => void;
}

interface MetricsData {
  totalDocuments: number;
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  ledger,
  savedClients,
  savedItems,
  onCreateNew,
  onLoadDocument,
  onShowLedger,
  onShowAnalytics,
  onShowClients,
  onShowItems,
  onShowCloudSync,
}) => {
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(DocumentType.Invoice);

  const metrics = useMemo<MetricsData>(() => {
    const now = new Date();
    let totalDocuments = 0;
    let totalRevenue = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    Object.values(ledger).forEach(entry => {
      if (entry.isRecurringTemplate) return;

      totalDocuments++;

      const data = entry.data;
      const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
      const taxAmount = (subtotal * data.taxRate) / 100;
      const total = subtotal + taxAmount - data.discount;

      totalRevenue += total;

      const balanceDue = total - data.amountPaid;
      if (data.status !== 'Paid') {
        pendingAmount += balanceDue;

        // Check if overdue
        if (data.documentType !== 'Receipt' && data.documentType !== 'Contract / Agreement') {
          const dueDate = new Date(data.dueDate);
          if (dueDate < now) {
            overdueAmount += balanceDue;
          }
        }
      }
    });

    return { totalDocuments, totalRevenue, pendingAmount, overdueAmount };
  }, [ledger]);

  const hasData = Object.keys(ledger).length > 0 || savedClients.length > 0 || savedItems.length > 0;

  const recentDocuments = useMemo(() => {
    return Object.values(ledger)
      .filter(entry => !entry.isRecurringTemplate)
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
      .slice(0, 5);
  }, [ledger]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (e) {
      return `$${amount.toFixed(2)}`;
    }
  };

  const getClientName = (data: InvoiceData) => {
    return data.to.isBusiness ? data.to.businessName : data.to.name;
  };

  const calculateTotal = (data: InvoiceData) => {
    const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
    const taxAmount = (subtotal * data.taxRate) / 100;
    return subtotal + taxAmount - data.discount;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">AI Document Generator</h1>
          <p className="text-slate-600">Create and manage your business documents with AI assistance</p>
        </div>

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm text-slate-600 mb-1">Total Documents</div>
            <div className="text-3xl font-bold text-slate-800">{metrics.totalDocuments}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm text-slate-600 mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm text-slate-600 mb-1">Pending Amount</div>
            <div className="text-3xl font-bold text-blue-600">{formatCurrency(metrics.pendingAmount)}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-sm text-slate-600 mb-1">Overdue Amount</div>
            <div className="text-3xl font-bold text-red-600">{formatCurrency(metrics.overdueAmount)}</div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <h3 className="font-medium text-slate-800 mb-2">Create New Document</h3>
              <div className="flex space-x-2">
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as DocumentType)}
                  className="flex-1 text-sm p-2 border border-slate-300 rounded-md"
                >
                  {Object.values(DocumentType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <button
                  onClick={() => onCreateNew(selectedDocType)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer" onClick={onShowLedger}>
              <h3 className="font-medium text-slate-800 mb-2">View All Documents</h3>
              <p className="text-sm text-slate-600">Access your document ledger</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer" onClick={onShowAnalytics}>
              <h3 className="font-medium text-slate-800 mb-2">View Analytics</h3>
              <p className="text-sm text-slate-600">Detailed business insights</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer" onClick={onShowClients}>
              <h3 className="font-medium text-slate-800 mb-2">Manage Clients</h3>
              <p className="text-sm text-slate-600">Add and edit client information</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer" onClick={onShowItems}>
              <h3 className="font-medium text-slate-800 mb-2">Manage Items</h3>
              <p className="text-sm text-slate-600">Manage your product/service catalog</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer" onClick={onShowCloudSync}>
              <h3 className="font-medium text-slate-800 mb-2">Cloud Sync</h3>
              <p className="text-sm text-slate-600">Sync data across devices</p>
            </div>
          </div>
        </div>

        {/* Recent Documents Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-slate-800">Recent Documents</h2>
          </div>
          <div className="overflow-x-auto">
            {recentDocuments.length > 0 ? (
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Document #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Modified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {recentDocuments.map(entry => (
                    <tr key={entry.data.documentNumber} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {entry.data.documentNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {entry.data.documentType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {getClientName(entry.data)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900">
                        {formatCurrency(calculateTotal(entry.data), entry.data.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          entry.data.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          entry.data.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' :
                          entry.data.status === 'Emailed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.data.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(entry.lastModified).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => onLoadDocument(entry.data)}
                          className="text-slate-600 hover:text-slate-900 hover:underline"
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">No documents yet</h3>
                <p className="text-slate-500">Create your first document to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};