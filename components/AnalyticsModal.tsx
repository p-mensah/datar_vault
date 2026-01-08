import React, { useState, useEffect } from 'react';
import { DocumentLedger, InvoiceData, DocumentStatus, LedgerEntry } from '../types';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: DocumentLedger;
}

interface AnalyticsData {
  totalRevenue: number;
  paidAmount: number;
  draftAmount: number;
  overdueAmount: number;
  byDocumentType: Record<string, { count: number; amount: number }>;
  byClient: Record<string, { count: number; amount: number }>;
  byStatus: Record<DocumentStatus, { count: number; amount: number }>;
  monthlyTrends: Record<string, number>;
}

const STATUS_COLORS: Record<DocumentStatus, string> = {
  'Draft': '#94a3b8',
  'Emailed': '#3b82f6',
  'Paid': '#10b981',
  'Partially Paid': '#f59e0b'
};

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose, ledger }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'all' | 'year' | 'month' | 'week'>('year');

  useEffect(() => {
    if (isOpen) {
      calculateAnalytics();
    }
  }, [isOpen, ledger, timeRange]);

  const calculateAnalytics = () => {
    setLoading(true);

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    const filteredEntries = Object.values(ledger).filter((entry: LedgerEntry) => {
      if (entry.isRecurringTemplate) return false;
      const issueDate = new Date(entry.data.issueDate);
      return issueDate >= startDate;
    });

    const result: AnalyticsData = {
      totalRevenue: 0,
      paidAmount: 0,
      draftAmount: 0,
      overdueAmount: 0,
      byDocumentType: {},
      byClient: {},
      byStatus: { Draft: { count: 0, amount: 0 }, Emailed: { count: 0, amount: 0 }, Paid: { count: 0, amount: 0 }, 'Partially Paid': { count: 0, amount: 0 } },
      monthlyTrends: {}
    };

    filteredEntries.forEach(entry => {
      const data = entry.data;
      const subtotal = data.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
      const taxAmount = (subtotal * data.taxRate) / 100;
      const total = subtotal + taxAmount - data.discount;
      const balanceDue = total - data.amountPaid;

      result.totalRevenue += total;

      // Update status amounts
      if (data.status === 'Paid') {
        result.paidAmount += data.amountPaid;
      } else if (data.status === 'Draft') {
        result.draftAmount += total;
      }

      // Check if overdue (not paid and due date has passed)
      if (data.status !== 'Paid' && !['Receipt', 'Contract'].includes(data.documentType)) {
        const dueDate = new Date(data.dueDate);
        if (dueDate < now) {
          result.overdueAmount += balanceDue;
        }
      }

      // By document type
      if (!result.byDocumentType[data.documentType]) {
        result.byDocumentType[data.documentType] = { count: 0, amount: 0 };
      }
      result.byDocumentType[data.documentType].count++;
      result.byDocumentType[data.documentType].amount += total;

      // By client
      const clientName = data.to.isBusiness ? data.to.businessName : data.to.name;
      if (!result.byClient[clientName]) {
        result.byClient[clientName] = { count: 0, amount: 0 };
      }
      result.byClient[clientName].count++;
      result.byClient[clientName].amount += total;

      // By status
      result.byStatus[data.status].count++;
      result.byStatus[data.status].amount += (data.status === 'Paid' ? data.amountPaid : total);

      // Monthly trends
      const monthKey = new Date(data.issueDate).toLocaleString('default', { year: 'numeric', month: 'short' });
      if (!result.monthlyTrends[monthKey]) {
        result.monthlyTrends[monthKey] = 0;
      }
      result.monthlyTrends[monthKey] += total;
    });

    setAnalyticsData(result);
    setLoading(false);
  };

  if (!isOpen) return null;

  // Prepare chart data
  const statusChartData = {
    labels: Object.keys(analyticsData?.byStatus || {}),
    datasets: [
      {
        data: analyticsData ? Object.values(analyticsData.byStatus).map(s => s.amount) : [],
        backgroundColor: Object.keys(analyticsData?.byStatus || {}).map(status => STATUS_COLORS[status as DocumentStatus]),
        borderWidth: 1,
      },
    ],
  };

  const documentTypeChartData = {
    labels: analyticsData ? Object.keys(analyticsData.byDocumentType) : [],
    datasets: [
      {
        label: 'Amount',
        data: analyticsData ? Object.values(analyticsData.byDocumentType).map(dt => dt.amount) : [],
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1,
      },
    ],
  };

  const monthlyTrendChartData = {
    labels: analyticsData ? Object.keys(analyticsData.monthlyTrends).sort() : [],
    datasets: [
      {
        label: 'Revenue',
        data: analyticsData ? Object.keys(analyticsData.monthlyTrends).sort().map(m => analyticsData.monthlyTrends[m]) : [],
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1,
      },
    ],
  };

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 no-print" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-800">Business Analytics</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">Time Range:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'all' | 'year' | 'month' | 'week')}
                className="text-sm p-1 border border-slate-300 rounded-md"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400"></div>
            </div>
          ) : analyticsData && Object.keys(ledger).length > 0 ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <div className="text-sm text-slate-600">Total Revenue</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(analyticsData.totalRevenue)}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-700">Paid Amount</div>
                  <div className="text-2xl font-bold text-green-800 mt-1">{formatCurrency(analyticsData.paidAmount)}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700">Draft Amount</div>
                  <div className="text-2xl font-bold text-blue-800 mt-1">{formatCurrency(analyticsData.draftAmount)}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-sm text-yellow-700">Overdue Amount</div>
                  <div className="text-2xl font-bold text-yellow-800 mt-1">{formatCurrency(analyticsData.overdueAmount)}</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Document Status Distribution</h3>
                  <div className="h-64">
                    <Pie data={statusChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Revenue by Document Type</h3>
                  <div className="h-64">
                    <Bar data={documentTypeChartData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y' as const,
                    }} />
                  </div>
                </div>
              </div>

              {/* Monthly Trends */}
              <div className="bg-white p-4 rounded-lg border mb-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Monthly Revenue Trends</h3>
                <div className="h-64">
                  <Bar data={monthlyTrendChartData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }} />
                </div>
              </div>

              {/* Top Clients */}
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Top Clients by Revenue</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Client</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-slate-500">Documents</th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-slate-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData && Object.entries(analyticsData.byClient)
                        .sort((a, b) => b[1].amount - a[1].amount)
                        .slice(0, 5)
                        .map(([clientName, data]) => (
                          <tr key={clientName} className="border-b last:border-b-0">
                            <td className="px-4 py-3 text-sm text-slate-700">{clientName}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{data.count}</td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">{formatCurrency(data.amount)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-slate-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">No Data Available</h3>
              <p className="text-slate-500">Your analytics dashboard will appear here once you start creating and saving documents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};