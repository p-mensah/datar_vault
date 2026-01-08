
import React from 'react';
import { InvoiceData, DocumentType, Template, ContractType, SavedClient, SavedItem, RecurringFrequency, InvoiceTemplate } from '../types';
import { DOCUMENT_TYPES, CURRENCIES, TEMPLATES, CONTRACT_TYPES, CONTRACT_TEMPLATES, INVOICE_TEMPLATES } from '../constants';
import { PlusIcon, TrashIcon, SparklesIcon, SettingsIcon, UserIcon, FileTextIcon, DollarSignIcon, PaperclipIcon, InfoIcon, CreditCardIcon, UsersIcon, LockClosedIcon, HomeIcon, ClipboardDocumentCheckIcon, SaveIcon, AddressBookIcon, RecurringIcon } from './Icons';
import { Accordion } from './Accordion';

const Input: React.FC<any> = ({ label, small = false, ...props }) => (
    <div>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <input {...props} className={`w-full border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 ${small ? 'p-1 text-sm' : 'p-2'}`} />
    </div>
  );
  
const Textarea: React.FC<any> = ({ label, ...props }) => (
    <div>
        {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
        <textarea {...props} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
    </div>
);

const formatCurrency = (amount: number, currency: string) => {
    try {
        const locale = currency === 'GHS' ? 'en-GH' : 'en-US';
        const formatted = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
        }).format(amount);
        if (currency === 'GHS') {
          return formatted.replace(/GH₵/g, '₵').replace(/GHS/g, '₵');
        }
        return formatted;
      } catch (e) {
        console.warn(`Currency formatting failed for ${currency}. Using fallback.`);
        return `${currency} ${amount.toFixed(2)}`;
      }
};

const ModernTemplateThumbnail: React.FC<{isSelected: boolean}> = ({isSelected}) => ( <div className={`h-24 w-full border-2 rounded-lg bg-white flex items-center justify-center text-sm font-semibold ${isSelected ? 'border-slate-700 ring-2 ring-slate-700 ring-offset-2' : 'border-slate-300'}`}><div className="h-16 w-16 bg-slate-200 rounded-md"></div></div> );
const ClassicTemplateThumbnail: React.FC<{isSelected: boolean}> = ({isSelected}) => ( <div className={`h-24 w-full border-2 rounded-lg bg-[#fdfdfa] flex items-center justify-center text-sm font-semibold ${isSelected ? 'border-slate-700 ring-2 ring-slate-700 ring-offset-2' : 'border-slate-300'}`}><div className="h-16 w-16 border-2 border-dashed border-slate-400 rounded-md"></div></div> );
const CreativeTemplateThumbnail: React.FC<{isSelected: boolean}> = ({isSelected}) => ( <div className={`h-24 w-full border-2 rounded-lg bg-white flex items-center justify-center text-sm font-semibold relative overflow-hidden ${isSelected ? 'border-pink-500 ring-2 ring-pink-500 ring-offset-2' : 'border-slate-300'}`}><div className="absolute left-0 top-0 bottom-0 w-3 bg-pink-400"></div><div className="h-16 w-16 bg-pink-100 rounded-md"></div></div> );

const ServiceAgreementThumbnail: React.FC<{ isSelected: boolean }> = ({ isSelected }) => (
    <div className={`h-36 w-full border-2 rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all ${isSelected ? 'border-slate-700 ring-2 ring-slate-700 ring-offset-2' : 'border-slate-300 bg-white hover:border-slate-500'}`}>
      <ClipboardDocumentCheckIcon className={`h-8 w-8 mb-2 ${isSelected ? 'text-slate-700' : 'text-slate-500'}`} />
      <span className={`font-semibold text-sm ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>Service Agreement</span>
      <p className="text-xs text-slate-500 mt-1">For providing services to a client.</p>
    </div>
);
const NdaThumbnail: React.FC<{ isSelected: boolean }> = ({ isSelected }) => (
    <div className={`h-36 w-full border-2 rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all ${isSelected ? 'border-slate-700 ring-2 ring-slate-700 ring-offset-2' : 'border-slate-300 bg-white hover:border-slate-500'}`}>
      <LockClosedIcon className={`h-8 w-8 mb-2 ${isSelected ? 'text-slate-700' : 'text-slate-500'}`} />
      <span className={`font-semibold text-sm ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>NDA</span>
      <p className="text-xs text-slate-500 mt-1">For protecting confidential information.</p>
    </div>
);
const LeaseThumbnail: React.FC<{ isSelected: boolean }> = ({ isSelected }) => (
    <div className={`h-36 w-full border-2 rounded-lg p-3 flex flex-col items-center justify-center text-center transition-all ${isSelected ? 'border-slate-700 ring-2 ring-slate-700 ring-offset-2' : 'border-slate-300 bg-white hover:border-slate-500'}`}>
      <HomeIcon className={`h-8 w-8 mb-2 ${isSelected ? 'text-slate-700' : 'text-slate-500'}`} />
      <span className={`font-semibold text-sm ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>Lease Agreement</span>
      <p className="text-xs text-slate-500 mt-1">For renting property to a tenant.</p>
    </div>
);

interface InvoiceFormProps {
  invoiceData: InvoiceData;
  setInvoiceData: React.Dispatch<React.SetStateAction<InvoiceData>>;
  onGenerateContract: () => void;
  isGenerating: boolean;
  error: string | null;
  savedClients: SavedClient[];
  setSavedClients: React.Dispatch<React.SetStateAction<SavedClient[]>>;
  savedItems: SavedItem[];
  onGenerateTerms: (prompt: string) => void;
}

const getReferenceLabel = (docType: DocumentType) => {
    switch (docType) {
      case DocumentType.Invoice:
      case DocumentType.ProformaInvoice: return 'Invoice #';
      case DocumentType.Quotation: return 'Quote #';
      case DocumentType.Statement: return 'Statement #';
      default: return 'Ref #';
    }
};

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoiceData, setInvoiceData, onGenerateContract, isGenerating, error, savedClients, setSavedClients, savedItems, onGenerateTerms }) => {
  const [showNotes, setShowNotes] = React.useState(!!invoiceData.notes);

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumeric = ['taxRate', 'discount', 'openingBalance'].includes(name);

    if (name === 'taxRate' && value === '') {
        setInvoiceData(prev => ({ ...prev, taxRate: 0 }));
        return;
    }

    setInvoiceData(prev => {
        const updatedData = { ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value };

        // if invoice template changes, load the template
        if (name === 'selectedInvoiceTemplate') {
            const newType = value as InvoiceTemplate;
            const template = INVOICE_TEMPLATES[newType];
            if (template) {
                Object.assign(updatedData, template);
            }
        }

        return updatedData;
    });
  };
  const handlePartyChange = (party: 'from' | 'to', e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setInvoiceData(prev => ({
      ...prev,
      [party]: { ...prev[party], [name]: type === 'checkbox' ? checked : value }
    }));
  };
  const handleItemChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, items: prev.items.map(item => item.id === id ? { ...item, [name]: (name === 'quantity' || name === 'rate') ? parseFloat(value) || 0 : value } : item)}));
  };
  const handleContractDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const updatedContractDetails = { ...invoiceData.contractDetails, [name]: value };

    // if contract type changes, load the template for it
    if (name === 'contractType') {
        const newType = value as ContractType;
        const template = CONTRACT_TEMPLATES[newType];
        if(template) {
            Object.assign(updatedContractDetails, template);
        }
    }

    setInvoiceData(prev => ({
        ...prev,
        contractDetails: updatedContractDetails
    }));
  };
  const handlePaymentDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, paymentDetails: { ...prev.paymentDetails, [name]: value } }));
  };
   const handleRecurringSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setInvoiceData(prev => ({
      ...prev,
      recurringSettings: {
        ...prev.recurringSettings!,
        [name]: type === 'checkbox' ? checked : value,
        ...((name === 'isRecurring' && !checked) && { frequency: null }) // Reset frequency if disabled
      }
    }));
  };

  const handleCustomRecurringChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({
      ...prev,
      recurringSettings: {
        ...prev.recurringSettings!,
        [name]: value
      }
    }));
  };
  const addItem = () => { setInvoiceData(prev => ({...prev, items: [...prev.items, { id: Date.now().toString(), description: '', quantity: 1, rate: 0, unit: '' }]})); };
  const removeItem = (id: string) => { setInvoiceData(prev => ({...prev, items: prev.items.filter(item => item.id !== id)})); };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            setInvoiceData(prev => ({...prev, logoUrl: event.target?.result as string}));
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };
  const handleLoadClient = (clientId: string) => {
    const client = savedClients.find(c => c.id === clientId);
    if (client) setInvoiceData(prev => ({ ...prev, to: client }));
  };
  const handleSaveClient = () => {
    const { to } = invoiceData;
    if (!to.name && !to.businessName) { alert("Please enter a client name or business name to save."); return; }
    const existing = savedClients.find(c => (c.name === to.name && c.businessName === to.businessName));
    if (existing) { if (!window.confirm("A client with this name already exists. Overwrite?")) return; setSavedClients(savedClients.map(c => c.id === existing.id ? { ...to, id: c.id } : c)); alert("Client updated."); }
    else { setSavedClients([...savedClients, { ...to, id: Date.now().toString() }]); alert("Client saved!"); }
  };
  const handleAddSavedItem = (itemId: string) => {
    const item = savedItems.find(i => i.id === itemId);
    if (item) setInvoiceData(prev => ({ ...prev, items: [...prev.items, { id: Date.now().toString(), description: item.description, rate: item.rate, unit: item.unit || '', quantity: 1 }] }));
  };
  const handleGenerateTermsClick = () => {
    const prompt = window.prompt("Enter key points for your terms (e.g., 'Payment due in 15 days, 5% late fee').");
    if (prompt) onGenerateTerms(prompt);
  };
  
  const renderPartyFields = (party: 'from' | 'to') => (
    <div className="space-y-4">
        <label className="flex items-center space-x-3">
            <input type="checkbox" name="isBusiness" checked={invoiceData[party].isBusiness} onChange={(e) => handlePartyChange(party, e)} className="h-4 w-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500" />
            <span className="text-slate-700">This is a business</span>
        </label>
        {invoiceData[party].isBusiness ? (
            <>
                <Input label="Company Name" name="businessName" value={invoiceData[party].businessName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePartyChange(party, e)} />
                <Input label="Contact Person" name="name" value={invoiceData[party].name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePartyChange(party, e)} />
            </>
        ) : (
            <Input label="Full Name" name="name" value={invoiceData[party].name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePartyChange(party, e)} />
        )}
        <Textarea label="Address" name="address" value={invoiceData[party].address} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handlePartyChange(party, e)} rows={3} />
        <Input label="Email" name="email" value={invoiceData[party].email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePartyChange(party, e)} />
        <Input label="Phone" name="phone" value={invoiceData[party].phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePartyChange(party, e)} />
        <Input label="Tax ID" name="taxId" value={invoiceData[party].taxId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePartyChange(party, e)} />
    </div>
  );
  const isContract = invoiceData.documentType === DocumentType.Contract;
  const isStatement = invoiceData.documentType === DocumentType.Statement;
  const isQuotation = invoiceData.documentType === DocumentType.Quotation;
  const isInvoice = invoiceData.documentType === DocumentType.Invoice;

  const showTemplateSelector = [
    DocumentType.Invoice,
    DocumentType.ProformaInvoice,
    DocumentType.Receipt,
    DocumentType.Quotation,
  ].includes(invoiceData.documentType);

  return (
    <div className="space-y-4 no-print">
      <Accordion title="Document Settings" icon={<SettingsIcon />} defaultOpen> 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
                <select name="documentType" value={invoiceData.documentType} onChange={handleDataChange} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500">
                    {DOCUMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
            <Input label={isContract ? "Contract Number" : "Document Number"} name="documentNumber" value={invoiceData.documentNumber} onChange={handleDataChange} />
            <Input label={isStatement ? "Statement Date" : "Issue Date"} name="issueDate" type="date" value={invoiceData.issueDate} onChange={handleDataChange} />
            { !isContract && !isStatement && <Input label={isQuotation ? "Valid Until" : "Due Date"} name="dueDate" type="date" value={invoiceData.dueDate} onChange={handleDataChange} /> }
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                <select name="currency" value={invoiceData.currency} onChange={handleDataChange} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500">
                    {CURRENCIES.map(({code, display}) => <option key={code} value={code}>{display}</option>)}
                </select>
            </div>
            { showTemplateSelector && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Visual Template</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[Template.Modern, Template.Classic, Template.Creative].map(t => (
                                <button key={t} onClick={() => setInvoiceData(prev => ({ ...prev, template: t }))}>
                                    {t === Template.Modern && <ModernTemplateThumbnail isSelected={invoiceData.template === t} />}
                                    {t === Template.Classic && <ClassicTemplateThumbnail isSelected={invoiceData.template === t} />}
                                    {t === Template.Creative && <CreativeTemplateThumbnail isSelected={invoiceData.template === t} />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Content Template</label>
                        <select name="selectedInvoiceTemplate" value={invoiceData.selectedInvoiceTemplate} onChange={handleDataChange} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500">
                            {Object.values(InvoiceTemplate).map(template => <option key={template} value={template}>{template}</option>)}
                        </select>
                    </div>
                </>
            )}
        </div>
      </Accordion>
      <Accordion title="From" icon={<UserIcon />}> {renderPartyFields('from')} </Accordion>
      
      <Accordion title="To" icon={<UserIcon />}>
        <div className="flex items-end gap-2 mb-4">
            <div className="flex-grow">
                <label className="block text-sm font-medium text-slate-700 mb-1">Load Saved Client</label>
                <select onChange={e => handleLoadClient(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" value="">
                    <option value="" disabled>-- Select a client --</option>
                    {savedClients.map(c => <option key={c.id} value={c.id}>{c.isBusiness ? c.businessName : c.name}</option>)}
                </select>
            </div>
            <button onClick={handleSaveClient} title="Save current client" className="p-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-100"><SaveIcon className="h-5 w-5"/></button>
        </div>
        {renderPartyFields('to')}
      </Accordion>

      <Accordion title={isStatement ? "New Charges" : (isContract ? "Contract Details" : "Items / Services")} icon={<FileTextIcon />}>
        {isContract ? (
            <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Contract Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {CONTRACT_TYPES.map(type => (
                            <button key={type} onClick={() => handleContractDetailChange({ target: { name: 'contractType', value: type } } as any)}>
                                {type === ContractType.Service && <ServiceAgreementThumbnail isSelected={invoiceData.contractDetails.contractType === type} />}
                                {type === ContractType.NDA && <NdaThumbnail isSelected={invoiceData.contractDetails.contractType === type} />}
                                {type === ContractType.Lease && <LeaseThumbnail isSelected={invoiceData.contractDetails.contractType === type} />}
                            </button>
                        ))}
                    </div>
                </div>
                <Input label="Effective Start Date" name="startDate" type="date" value={invoiceData.contractDetails.startDate} onChange={handleContractDetailChange} />
                <Textarea label="Scope of Work / Purpose" name="scopeOfWork" value={invoiceData.contractDetails.scopeOfWork} onChange={handleContractDetailChange} rows={5} />
                <Textarea label="Payment Terms" name="paymentTerms" value={invoiceData.contractDetails.paymentTerms} onChange={handleContractDetailChange} rows={3} />
                <Input label="Governing Law & Jurisdiction" name="jurisdiction" value={invoiceData.contractDetails.jurisdiction} onChange={handleContractDetailChange} />
                <Input label="Term Length" name="termLength" value={invoiceData.contractDetails.termLength} onChange={handleContractDetailChange} />
                <Textarea label="Termination Clause" name="terminationClauseDetails" value={invoiceData.contractDetails.terminationClauseDetails} onChange={handleContractDetailChange} rows={3} />
                <Textarea label="Indemnification Clause" name="indemnification" value={invoiceData.contractDetails.indemnification} onChange={handleContractDetailChange} rows={3} />
            </div>
         ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {invoiceData.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 p-2 border rounded-md bg-slate-50">
                  <div className="col-span-12 md:col-span-4"><Input placeholder="Description" name="description" value={item.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(item.id, e)} small /></div>
                  <div className="col-span-3 md:col-span-2"><Input placeholder="Qty" name="quantity" type="number" value={item.quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(item.id, e)} small /></div>
                  <div className="col-span-4 md:col-span-2"><Input placeholder="Unit" name="unit" value={item.unit || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(item.id, e)} small /></div>
                  <div className="col-span-5 md:col-span-2"><Input placeholder="Rate" name="rate" type="number" value={item.rate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(item.id, e)} small /></div>
                  <div className="col-span-4 md:col-span-1 flex items-center justify-end text-slate-700 font-medium">{formatCurrency(item.quantity * item.rate, invoiceData.currency)}</div>
                  <div className="col-span-3 md:col-span-1 flex items-center justify-end"><button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"><TrashIcon className="h-5 w-5" /></button></div>
                </div>
              ))}
            </div>
             <div className="mt-4 pt-4 border-t border-dashed border-slate-300">
                <h4 className="text-sm font-medium text-slate-600 mb-2">Add Saved Item</h4>
                <select onChange={e => { handleAddSavedItem(e.target.value); e.target.value = ''; }} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" value="">
                    <option value="" disabled>-- Select an item to add --</option>
                    {savedItems.map(i => <option key={i.id} value={i.id}>{i.description} ({formatCurrency(i.rate, invoiceData.currency)})</option>)}
                </select>
            </div>
            <button onClick={addItem} className="w-full flex items-center justify-center py-2 px-4 border border-dashed border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"><PlusIcon className="h-5 w-5 mr-2" /> Add Blank Item</button>
          </div>
        )}
      </Accordion>

      {isInvoice && (
        <Accordion title="Automate & Schedule" icon={<RecurringIcon />}>
            <div className="space-y-4">
                <label className="flex items-center space-x-3">
                    <input type="checkbox" name="isRecurring" checked={invoiceData.recurringSettings?.isRecurring} onChange={handleRecurringSettingsChange} className="h-4 w-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500" />
                    <span className="font-medium text-slate-700">Enable Recurring Invoice</span>
                </label>
                {invoiceData.recurringSettings?.isRecurring && (
                    <div className="space-y-6 pt-4 border-t">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Frequency Pattern</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Standard Frequency</label>
                                    <select name="frequency" value={invoiceData.recurringSettings.frequency || ''} onChange={handleRecurringSettingsChange} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500">
                                        <option value="" disabled>Select frequency</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Custom Frequency</label>
                                    <div className="flex gap-2">
                                        <input type="number" name="customInterval" value={invoiceData.recurringSettings.customInterval || ''} onChange={handleCustomRecurringChange} placeholder="Every" min="1" className="w-20 p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
                                        <select name="customUnit" value={invoiceData.recurringSettings.customUnit || 'days'} onChange={handleCustomRecurringChange} className="p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500">
                                            <option value="days">Days</option>
                                            <option value="weeks">Weeks</option>
                                            <option value="months">Months</option>
                                            <option value="years">Years</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Start Date" name="startDate" type="date" value={invoiceData.recurringSettings.startDate} onChange={handleRecurringSettingsChange} />
                            <Input label="End Date (Optional)" name="endDate" type="date" value={invoiceData.recurringSettings.endDate} onChange={handleRecurringSettingsChange} />
                        </div>

                        <div className="border-t pt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Advanced Scheduling Options</label>
                            <div className="space-y-3">
                                <label className="flex items-start space-x-3">
                                    <input type="checkbox" name="specificDaysOfWeek" checked={invoiceData.recurringSettings?.specificDaysOfWeek} onChange={handleRecurringSettingsChange} className="h-4 w-4 mt-1 rounded border-gray-300 text-slate-600 focus:ring-slate-500" />
                                    <span className="text-sm text-slate-700">Specific days of week (e.g., every Monday and Friday)</span>
                                </label>
                                <label className="flex items-start space-x-3">
                                    <input type="checkbox" name="specificDaysOfMonth" checked={invoiceData.recurringSettings?.specificDaysOfMonth} onChange={handleRecurringSettingsChange} className="h-4 w-4 mt-1 rounded border-gray-300 text-slate-600 focus:ring-slate-500" />
                                    <span className="text-sm text-slate-700">Specific days of month (e.g., 1st and 15th)</span>
                                </label>
                                <label className="flex items-start space-x-3">
                                    <input type="checkbox" name="monthlyOnWeekday" checked={invoiceData.recurringSettings?.monthlyOnWeekday} onChange={handleRecurringSettingsChange} className="h-4 w-4 mt-1 rounded border-gray-300 text-slate-600 focus:ring-slate-500" />
                                    <span className="text-sm text-slate-700">Monthly on specific weekday (e.g., 2nd Tuesday)</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-md text-sm text-slate-600">
                            <strong>Note:</strong> Custom frequency settings will override standard frequency when both are specified. Advanced scheduling options are available for more complex recurring patterns.
                        </div>
                    </div>
                )}
            </div>
        </Accordion>
      )}

      <Accordion title="Final Details" icon={<DollarSignIcon />}>
        <div className="space-y-4">
            {isStatement && <Input label="Opening Balance" name="openingBalance" type="number" value={invoiceData.openingBalance || 0} onChange={handleDataChange} />}
            <Input label="Tax Rate (%) (Optional)" name="taxRate" type="number" value={invoiceData.taxRate} onChange={handleDataChange} placeholder="e.g., 8" />
            <Input label={isStatement ? "Payments / Credits" : "Discount"} name="discount" type="number" value={invoiceData.discount} onChange={handleDataChange} />
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <Textarea name="notes" value={invoiceData.notes} onChange={handleDataChange} rows={4} />
            </div>
        </div>
      </Accordion>
      <Accordion title="Payment Information" icon={<CreditCardIcon />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Bank Name" name="bankName" value={invoiceData.paymentDetails.bankName} onChange={handlePaymentDetailChange} />
            <Input label="Branch Name" name="branchName" value={invoiceData.paymentDetails.branchName} onChange={handlePaymentDetailChange} />
            <Input label="Account Name" name="accountName" value={invoiceData.paymentDetails.accountName} onChange={handlePaymentDetailChange} />
            <Input label="Account Number" name="accountNumber" value={invoiceData.paymentDetails.accountNumber} onChange={handlePaymentDetailChange} />
            <Input label="Sort Code" name="sortCode" value={invoiceData.paymentDetails.sortCode} onChange={handlePaymentDetailChange} />
            <div className="md:col-span-2 border-t pt-4">
                <h4 className="text-md font-medium text-slate-700 mb-2">Mobile Money (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Network (e.g., MTN, Vodafone)" name="momoNetwork" value={invoiceData.paymentDetails.momoNetwork} onChange={handlePaymentDetailChange} />
                    <Input label="Account Name" name="momoAccountName" value={invoiceData.paymentDetails.momoAccountName} onChange={handlePaymentDetailChange} />
                    <Input label="Account Number" name="momoAccountNumber" value={invoiceData.paymentDetails.momoAccountNumber} onChange={handlePaymentDetailChange} />
                </div>
                <div className="mt-3 p-2 bg-slate-100 rounded-md text-xs text-slate-600 flex items-start">
                    <InfoIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" title="Information"/>
                    <span>
                        Note: For client payments, the payment reference will be automatically set to <strong>{getReferenceLabel(invoiceData.documentType)} {invoiceData.documentNumber}</strong> on the final document.
                    </span>
                </div>
            </div>
        </div>
      </Accordion>

      <Accordion title="Terms & Conditions" icon={<ClipboardDocumentCheckIcon />}>
          <Textarea label="Provide your terms of service or any other conditions." name="termsAndConditions" value={invoiceData.termsAndConditions} onChange={handleDataChange} rows={5} />
          <button onClick={handleGenerateTermsClick} disabled={isGenerating} className="mt-2 w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400">
              {isGenerating ? 'Generating...' : <><SparklesIcon className="h-5 w-5 mr-2"/> Generate with AI</>}
          </button>
      </Accordion>
      
       <Accordion title="Attachments" icon={<PaperclipIcon />}>
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Logo</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"/>
            <p className="text-xs text-slate-500 mt-1">Upload your company logo. Recommended format: PNG, JPG.</p>
        </div>
       </Accordion>
    </div>
  );
};
