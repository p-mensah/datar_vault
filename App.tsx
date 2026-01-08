
import React, { useState, useCallback, useEffect, useRef } from 'react';
import TabbedInvoiceForm from './components/TabbedInvoiceForm';
import { InvoicePreview, InvoicePreviewRef } from './components/InvoicePreview';
import { Dashboard } from './components/Dashboard';
import { DashboardHeader, FormHeader } from './components/Header';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { DocumentLedgerModal } from './components/DocumentLedgerModal';
import { ClientManagerModal } from './components/ClientManagerModal';
import { ItemManagerModal } from './components/ItemManagerModal';
import { AnalyticsModal } from './components/AnalyticsModal.tsx';
import { CloudSyncModal } from './components/CloudSyncModal';
import { InvoiceData, DocumentType, ContractVersion, DocumentLedger, DocumentStatus, SavedClient, SavedItem, LedgerEntry, Notification } from './types';
import { DEFAULT_INVOICE_DATA } from './constants';
import { generateContractText, refineContractText, generateTermsText } from './services/geminiService';
import { getNextDocumentNumber, SEQUENCE_STORAGE_KEY } from './services/numberingService';
import { fetchExchangeRates } from './services/currencyService';
import { initializeDatabase, syncDataToSupabase, syncDataFromSupabase, getCurrentUser } from './services/supabaseService';
import { generateNotifications } from './services/notificationService';

const LOCAL_STORAGE_KEY = 'ai-invoice-generator-data';
const CONTRACT_VERSION_STORAGE_KEY = 'ai-contract-versions';
const LEDGER_STORAGE_KEY = 'ai-document-ledger';
const SAVED_CLIENTS_KEY = 'ai-saved-clients';
const SAVED_ITEMS_KEY = 'ai-saved-items';

const getInitialData = (): InvoiceData => {
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) return JSON.parse(savedData);
  } catch (error) { console.error("Failed to load data from local storage", error); }
  const initialNumber = getNextDocumentNumber(DEFAULT_INVOICE_DATA.documentType);
  return { ...DEFAULT_INVOICE_DATA, documentNumber: initialNumber };
};

const App: React.FC = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(getInitialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [contractVersions, setContractVersions] = useState<ContractVersion[]>([]);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [ledger, setLedger] = useState<DocumentLedger>({});
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isClientManagerOpen, setIsClientManagerOpen] = useState(false);
  const [isItemManagerOpen, setIsItemManagerOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'form'>('dashboard');

  const documentTypeRef = useRef(invoiceData.documentType);
  const previewRef = useRef<InvoicePreviewRef>(null);

  const checkAndGenerateRecurringInvoices = useCallback(() => {
    const currentLedger: DocumentLedger = JSON.parse(localStorage.getItem(LEDGER_STORAGE_KEY) || '{}');
    const updatedLedger = { ...currentLedger };
    let generatedCount = 0;

    Object.values(updatedLedger).forEach(entry => {
        if (entry.isRecurringTemplate && entry.data.recurringSettings?.status === 'Active') {
            const template = entry.data;
            const { frequency, nextDueDate, endDate } = template.recurringSettings;
            let currentNextDueDate = nextDueDate ? new Date(nextDueDate) : new Date();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            while (currentNextDueDate <= today) {
                // Generate a new invoice
                const newInvoice: InvoiceData = {
                    ...template,
                    documentNumber: getNextDocumentNumber(DocumentType.Invoice),
                    issueDate: currentNextDueDate.toISOString().split('T')[0],
                    status: 'Draft',
                    amountPaid: 0,
                    recurringSettings: undefined, // This is an instance, not a template
                };
                 // Calculate new due date based on original interval
                const originalIssueDate = new Date(template.issueDate);
                const originalDueDate = new Date(template.dueDate);
                const diffTime = Math.abs(originalDueDate.getTime() - originalIssueDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const newDueDate = new Date(currentNextDueDate);
                newDueDate.setDate(newDueDate.getDate() + diffDays);
                newInvoice.dueDate = newDueDate.toISOString().split('T')[0];

                updatedLedger[newInvoice.documentNumber] = {
                    data: newInvoice,
                    lastModified: new Date().toISOString(),
                    isRecurringTemplate: false,
                };
                generatedCount++;

                // Calculate the next due date
                if (frequency === 'weekly') {
                    currentNextDueDate.setDate(currentNextDueDate.getDate() + 7);
                } else if (frequency === 'monthly') {
                    currentNextDueDate.setMonth(currentNextDueDate.getMonth() + 1);
                } else if (frequency === 'yearly') {
                    currentNextDueDate.setFullYear(currentNextDueDate.getFullYear() + 1);
                }

                // Update template for next run
                entry.data.recurringSettings!.nextDueDate = currentNextDueDate.toISOString().split('T')[0];

                // Check if the schedule should end
                if (endDate && currentNextDueDate > new Date(endDate)) {
                    entry.data.recurringSettings!.status = 'Ended';
                    break; // Exit the while loop for this template
                }
            }
        }
    });

    if (generatedCount > 0) {
        setLedger(updatedLedger);
        localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updatedLedger));
        alert(`${generatedCount} new recurring invoice(s) have been generated and added to your ledger.`);
    }
  }, []);

  useEffect(() => {
    if (documentTypeRef.current !== invoiceData.documentType) {
      const newNumber = getNextDocumentNumber(invoiceData.documentType);
      setInvoiceData(prev => ({ ...prev, documentNumber: newNumber, status: 'Draft', amountPaid: 0 }));
      documentTypeRef.current = invoiceData.documentType;
    }
  }, [invoiceData.documentType]);
  
  useEffect(() => {
    try {
      const savedLedger = localStorage.getItem(LEDGER_STORAGE_KEY);
      if (savedLedger) setLedger(JSON.parse(savedLedger));
      const savedClientsData = localStorage.getItem(SAVED_CLIENTS_KEY);
      if (savedClientsData) setSavedClients(JSON.parse(savedClientsData));
      const savedItemsData = localStorage.getItem(SAVED_ITEMS_KEY);
      if (savedItemsData) setSavedItems(JSON.parse(savedItemsData));

      checkAndGenerateRecurringInvoices();
    } catch (error) { console.error("Failed to load data from local storage", error); }
  }, [checkAndGenerateRecurringInvoices]);

  useEffect(() => { localStorage.setItem(SAVED_CLIENTS_KEY, JSON.stringify(savedClients)); }, [savedClients]);
  useEffect(() => { localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(savedItems)); }, [savedItems]);

  useEffect(() => {
    if (invoiceData.documentType === DocumentType.Contract) {
      const allVersions = JSON.parse(localStorage.getItem(CONTRACT_VERSION_STORAGE_KEY) || '{}');
      const docVersions = allVersions[invoiceData.documentNumber] || [];
      setContractVersions(docVersions);
    } else { setContractVersions([]); }
  }, [invoiceData.documentNumber, invoiceData.documentType]);
  
  const updateLedger = (entryData: InvoiceData, isRecurringTemplate: boolean) => {
    const updatedLedger = { ...ledger, [entryData.documentNumber]: { data: entryData, lastModified: new Date().toISOString(), isRecurringTemplate } };
    setLedger(updatedLedger);
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updatedLedger));
  };

  const handleSave = () => {
    let dataToSave = { ...invoiceData };

    if (dataToSave.recurringSettings?.isRecurring) {
        if (!dataToSave.recurringSettings.frequency || !dataToSave.recurringSettings.startDate) {
            alert("Please select a frequency and start date for the recurring invoice.");
            return;
        }
        dataToSave.recurringSettings.nextDueDate = dataToSave.recurringSettings.startDate;
        dataToSave.recurringSettings.status = 'Active';
        updateLedger(dataToSave, true);
        alert('Recurring invoice schedule saved!');
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
        return;
    }


    if (invoiceData.documentType === DocumentType.Contract) {
      const newDocNumber = getNextDocumentNumber(DocumentType.Contract);
      dataToSave = { ...invoiceData, documentNumber: newDocNumber, status: 'Draft' };
      setInvoiceData(dataToSave);
      alert('Contract saved as new document: ' + newDocNumber);
    } else {
      const isNew = !ledger[invoiceData.documentNumber];
      dataToSave = { ...invoiceData, status: isNew ? 'Draft' : invoiceData.status };
      alert('Document saved successfully!');
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    updateLedger(dataToSave, false);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all form data? This will NOT clear your ledger, saved clients, or items.')) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        const newNumber = getNextDocumentNumber(DEFAULT_INVOICE_DATA.documentType);
        const resetData = { ...DEFAULT_INVOICE_DATA, documentNumber: newNumber };
        setInvoiceData(resetData);
        documentTypeRef.current = resetData.documentType;
    }
  }

  const handlePrint = () => { window.print(); };

  const handleEmail = async () => { 
    if (!invoiceData.to.email) {
        alert("Please enter a client email address.");
        return;
    }

    if (!previewRef.current) {
        alert("Preview component is not ready. Please wait a moment and try again.");
        return;
    }

    try {
        const wasInPreview = isPreviewMode;
        if (!wasInPreview) setIsPreviewMode(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        await previewRef.current.handleDownloadPdf();
        if (!wasInPreview) setIsPreviewMode(false);

        const subject = `${invoiceData.documentType} from ${invoiceData.from.isBusiness ? invoiceData.from.businessName : invoiceData.from.name}`;
        const body = `Dear ${invoiceData.to.name},\n\nPlease find the attached ${invoiceData.documentType.toLowerCase()}.\n\nThank you,\n${invoiceData.from.name}`;
        window.location.href = `mailto:${invoiceData.to.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch (error) {
        console.error("Failed to prepare email:", error);
        alert("Could not prepare the email. Please try downloading the PDF manually.");
    }
  };

  const handleGenerateContract = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
        const generatedText = await generateContractText(invoiceData);
        setInvoiceData(prev => ({
            ...prev,
            contractDetails: { ...prev.contractDetails, generatedText }
        }));
    } catch (err) {
        setError('Failed to generate contract. Please try again.');
        console.error(err);
    } finally {
        setIsGenerating(false);
    }
  }, [invoiceData]);

  const handleRefineContract = useCallback(async (refinementPrompt: string) => {
    if (!refinementPrompt) return;
    setIsGenerating(true);
    setError(null);
    try {
        const refinedText = await refineContractText(invoiceData.contractDetails.generatedText, refinementPrompt);
        setInvoiceData(prev => ({
            ...prev,
            contractDetails: { ...prev.contractDetails, generatedText: refinedText }
        }));
    } catch (err) {
        setError('Failed to refine contract. Please try again.');
        console.error(err);
    } finally {
        setIsGenerating(false);
    }
  }, [invoiceData.contractDetails.generatedText]);

  const handleGeneratedTextChange = useCallback((newText: string) => {
    setInvoiceData(prev => ({
        ...prev,
        contractDetails: { ...prev.contractDetails, generatedText: newText }
    }));
  }, []);
  
  const handleLoadVersion = (versionData: InvoiceData) => { if (window.confirm('Load this version? Unsaved changes will be lost.')) { setInvoiceData(versionData); setIsVersionModalOpen(false); setCurrentView('form'); }};
  const handleLoadFromLedger = (docData: InvoiceData) => { if (window.confirm(`Load document #${docData.documentNumber}? Unsaved changes will be lost.`)) { setInvoiceData(docData); setIsLedgerOpen(false); setCurrentView('form'); }};
  const handleDeleteFromLedger = (docNumber: string) => { 
    const entry = ledger[docNumber];
    const confirmMessage = entry?.isRecurringTemplate
      ? `This will delete the recurring schedule and stop all future invoices. This cannot be undone. Are you sure?`
      : `Permanently delete document #${docNumber}? This cannot be undone.`;

    if (window.confirm(confirmMessage)) {
       const updatedLedger = { ...ledger };
       delete updatedLedger[docNumber];
       setLedger(updatedLedger);
       localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updatedLedger));
    }
  };
  
  const handleStatusChange = (docNumber: string, status: DocumentStatus, amount?: number) => {
    const entry = ledger[docNumber];
    if (entry && !entry.isRecurringTemplate) {
        const updatedData = { ...entry.data, status };
        if (status === 'Paid') {
            const subtotal = updatedData.items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
            const taxAmount = (subtotal * updatedData.taxRate) / 100;
            const total = subtotal + taxAmount - updatedData.discount;
            updatedData.amountPaid = total;
        } else if (status === 'Partially Paid' && amount !== undefined) {
            updatedData.amountPaid = amount;
        } else if (status === 'Draft' || status === 'Emailed') {
            updatedData.amountPaid = 0;
        }
        updateLedger(updatedData, false);
    }
  };
  
  const handleGenerateTerms = async (prompt: string) => {
      if (!prompt) { alert("Please provide some key points for the terms."); return; }
      setIsGenerating(true);
      try {
          const terms = await generateTermsText(prompt);
          setInvoiceData(prev => ({...prev, termsAndConditions: terms}));
      } catch (err) { setError("Failed to generate terms. Please try again."); console.error(err); } 
      finally { setIsGenerating(false); }
  };
  
  const handleExportData = () => {
      const dataToExport = {
          ledger,
          savedClients,
          savedItems,
          sequences: JSON.parse(localStorage.getItem(SEQUENCE_STORAGE_KEY) || '{}'),
      };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datar-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert('Data exported successfully!');
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          if (window.confirm('Importing will overwrite existing data. Are you sure?')) {
            if (importedData.ledger) { setLedger(importedData.ledger); localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(importedData.ledger)); }
            if (importedData.savedClients) { setSavedClients(importedData.savedClients); localStorage.setItem(SAVED_CLIENTS_KEY, JSON.stringify(importedData.savedClients)); }
            if (importedData.savedItems) { setSavedItems(importedData.savedItems); localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(importedData.savedItems)); }
            if (importedData.sequences) { localStorage.setItem(SEQUENCE_STORAGE_KEY, JSON.stringify(importedData.sequences)); }
            alert('Data imported successfully!');
            window.location.reload();
          }
        } catch (err) { alert('Failed to parse import file. Please check the file format.'); console.error(err); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const getInitialDataForType = (documentType: DocumentType): InvoiceData => {
    const newNumber = getNextDocumentNumber(documentType);
    return { ...DEFAULT_INVOICE_DATA, documentType, documentNumber: newNumber };
  };

  const handleCreateNew = (documentType: DocumentType) => {
    const newData = getInitialDataForType(documentType);
    setInvoiceData(newData);
    setCurrentView('form');
  };

  const handleLoadFromDashboard = (data: InvoiceData) => {
    setInvoiceData(data);
    setCurrentView('form');
  };

  const handleLoadDocumentByNumber = (documentNumber: string) => {
    const entry = ledger[documentNumber];
    if (entry) {
      handleLoadFromDashboard(entry.data);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {currentView === 'dashboard' ? (
        <>
          <DashboardHeader
            onShowCloudSync={() => setIsCloudSyncOpen(true)}
            onShowAnalytics={() => setIsAnalyticsOpen(true)}
            onManageClients={() => setIsClientManagerOpen(true)}
            onManageItems={() => setIsItemManagerOpen(true)}
            onShowLedger={() => setIsLedgerOpen(true)}
            notifications={generateNotifications(ledger)}
            onLoadDocument={handleLoadDocumentByNumber}
          />
          <Dashboard
            ledger={ledger}
            savedClients={savedClients}
            savedItems={savedItems}
            onCreateNew={handleCreateNew}
            onLoadDocument={handleLoadFromDashboard}
            onShowLedger={() => setIsLedgerOpen(true)}
            onShowAnalytics={() => setIsAnalyticsOpen(true)}
            onShowClients={() => setIsClientManagerOpen(true)}
            onShowItems={() => setIsItemManagerOpen(true)}
            onShowCloudSync={() => setIsCloudSyncOpen(true)}
          />
        </>
      ) : (
        <>
          <FormHeader
            documentType={invoiceData.documentType}
            documentNumber={invoiceData.documentNumber}
            isPreviewMode={isPreviewMode}
            onTogglePreview={() => setIsPreviewMode(prev => !prev)}
            onShowHistory={() => setIsVersionModalOpen(true)}
            hasHistory={contractVersions.length > 0}
            onShowLedger={() => setIsLedgerOpen(true)}
            onSave={handleSave}
            onEmail={handleEmail}
            onPrint={handlePrint}
            onReset={handleReset}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
          <main className="p-4 md:p-8 lg:p-12">
            <div className={`max-w-7xl mx-auto ${!isPreviewMode ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : ''}`}>
              <div className={isPreviewMode ? 'hidden' : ''}>
                <TabbedInvoiceForm
                  invoiceData={invoiceData}
                  setInvoiceData={setInvoiceData}
                  onGenerateContract={handleGenerateContract}
                  isGenerating={isGenerating}
                  error={error}
                  savedClients={savedClients}
                  setSavedClients={setSavedClients}
                  savedItems={savedItems}
                  onGenerateTerms={handleGenerateTerms}
                />
              </div>
              <div className={isPreviewMode ? 'w-full max-w-4xl mx-auto' : ''}>
                <InvoicePreview ref={previewRef} invoiceData={invoiceData} onGenerateContract={handleGenerateContract} isGenerating={isGenerating} onRefineContract={handleRefineContract} onGeneratedTextChange={handleGeneratedTextChange} />
              </div>
            </div>
          </main>
        </>
      )}
      <VersionHistoryModal isOpen={isVersionModalOpen} onClose={() => setIsVersionModalOpen(false)} versions={contractVersions} onLoadVersion={handleLoadVersion} />
      <DocumentLedgerModal isOpen={isLedgerOpen} onClose={() => setIsLedgerOpen(false)} ledger={ledger} onLoad={handleLoadFromLedger} onDelete={handleDeleteFromLedger} onStatusChange={handleStatusChange} />
      <ClientManagerModal isOpen={isClientManagerOpen} onClose={() => setIsClientManagerOpen(false)} clients={savedClients} setClients={setSavedClients} />
      <ItemManagerModal isOpen={isItemManagerOpen} onClose={() => setIsItemManagerOpen(false)} items={savedItems} setItems={setSavedItems} currency={invoiceData.currency} />
      <AnalyticsModal isOpen={isAnalyticsOpen} onClose={() => setIsAnalyticsOpen(false)} ledger={ledger} />
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        ledger={ledger}
        clients={savedClients}
        items={savedItems}
        onSyncComplete={(syncedData) => {
          setLedger(syncedData.ledger);
          setSavedClients(syncedData.clients);
          setSavedItems(syncedData.items);
          alert('Data synced from cloud successfully!');
        }}
      />
    </div>
  );
};

export default App;
