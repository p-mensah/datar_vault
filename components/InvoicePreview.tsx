
import React, { useState, useEffect, useCallback, useRef, useImperativeHandle } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoiceData, DocumentType, Template } from '../types';
import { LogoPlaceholderIcon, SparklesIcon, DownloadIcon, UndoIcon, RedoIcon } from './Icons';

// Custom hook for managing state history (undo/redo)
const useHistory = (initialState: string) => {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);

  const setState = (action: string | ((prevState: string) => string), overwrite = false) => {
    const newState = typeof action === 'function' ? action(history[index]) : action;
    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      const updatedHistory = history.slice(0, index + 1);
      setHistory([...updatedHistory, newState]);
      setIndex(updatedHistory.length);
    }
  };

  const undo = () => index > 0 && setIndex(prev => prev - 1);
  const redo = () => index < history.length - 1 && setIndex(prev => prev - 1);

  return [history[index], setState, undo, redo, index, history.length] as const;
};


interface InvoicePreviewProps {
  invoiceData: InvoiceData;
  onGenerateContract: () => void;
  isGenerating: boolean;
  onRefineContract: (refinementPrompt: string) => Promise<void>;
  onGeneratedTextChange: (newText: string) => void;
}

export interface InvoicePreviewRef {
  handleDownloadPdf: () => Promise<void>;
  handleGeneratePdfBlob: () => Promise<Blob>;
}

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

const formatDate = (dateString: string) => {
  try {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Add timezone offset to prevent off-by-one day errors
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (error) {
    return dateString;
  }
};

const StatementBody: React.FC<{ invoiceData: InvoiceData; subtotal: number; statementTotal: number; }> = ({ invoiceData, subtotal, statementTotal }) => {
  const { items, currency, openingBalance = 0, discount = 0 } = invoiceData;
  return (
    <>
      <div className="mb-10 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-3">Account Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex justify-between border-b py-2">
              <span className="text-slate-600">Opening Balance</span>
              <span className="font-medium text-slate-800">{formatCurrency(openingBalance, currency)}</span>
            </div>
            <div className="flex justify-between border-b py-2">
              <span className="text-slate-600">New Charges for Period</span>
              <span className="font-medium text-slate-800">{formatCurrency(subtotal, currency)}</span>
            </div>
            {discount > 0 && (
                <div className="flex justify-between border-b py-2">
                    <span className="text-slate-600">Payments & Credits</span>
                    <span className="font-medium text-green-600">- {formatCurrency(discount, currency)}</span>
                </div>
            )}
        </div>
        <div className="mt-4 flex justify-between items-center bg-slate-100 p-3 rounded-lg">
            <span className="text-xl font-bold text-slate-900">Balance Due</span>
            <span className="text-xl font-bold text-slate-900">{formatCurrency(statementTotal, currency)}</span>
        </div>
      </div>

      <h4 className="text-lg font-semibold text-slate-800 mb-4">Activity for Period</h4>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-100 text-sm font-semibold text-slate-600 uppercase">
              <th className="p-4">Description</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                <td className="p-4">{item.description}</td>
                <td className="p-4 text-right font-medium">{formatCurrency(item.quantity * item.rate, currency)}</td>
              </tr>
            ))}
            {items.length === 0 && (
                <tr>
                    <td className="p-4 text-center text-slate-500" colSpan={2}>No new activity for this period.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};


export const InvoicePreview = React.forwardRef<InvoicePreviewRef, InvoicePreviewProps>(({ invoiceData, onGenerateContract, isGenerating, onRefineContract, onGeneratedTextChange }, ref) => {
  const { from, to, items, taxRate, discount, currency, notes, logoUrl, template, contractDetails, paymentDetails, documentType, termsAndConditions, status, amountPaid } = invoiceData;
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  
  const [editableText, setEditableText, undo, redo, historyIndex, historyLength] = useHistory(contractDetails.generatedText);
  const debounceTimeout = useRef<number | null>(null);

  // Sync history when the text is updated from an external source (AI generation/refinement)
  useEffect(() => {
    if (contractDetails.generatedText !== editableText) {
      setEditableText(contractDetails.generatedText);
    }
  }, [contractDetails.generatedText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    // Update local state immediately for responsiveness
    setEditableText(newText, true);

    // Debounce updating the global state and history
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = window.setTimeout(() => {
      onGeneratedTextChange(newText);
    }, 500);
  };
  
  const handleUndo = () => { undo(); };
  const handleRedo = () => { redo(); };

  useEffect(() => {
    onGeneratedTextChange(editableText);
  }, [editableText, onGeneratedTextChange]);


  const subtotal = items.reduce((acc, item) => acc + item.quantity * item.rate, 0);
  const taxAmount = (subtotal * taxRate) / 100;

  const isContract = documentType === DocumentType.Contract;
  const isStatement = documentType === DocumentType.Statement;
  const isQuotation = documentType === DocumentType.Quotation;
  const isReceipt = documentType === DocumentType.Receipt;

  const total = isStatement
    ? (invoiceData.openingBalance || 0) + subtotal - discount
    : subtotal + taxAmount - discount;
  
  const balanceDue = total - amountPaid;

  const templateClassMap = {
    [Template.Modern]: 'template-modern',
    [Template.Classic]: 'template-classic',
    [Template.Creative]: 'template-creative',
  };
  
  const templateClass = isStatement ? 'template-statement' : isContract ? '' : templateClassMap[template];
  const documentTitle = isContract ? contractDetails.contractType : documentType;
  const showPaymentDetails = [DocumentType.Invoice, DocumentType.ProformaInvoice, DocumentType.Statement].includes(documentType);

  const getReferenceLabel = (docType: DocumentType) => {
    switch (docType) {
      case DocumentType.Invoice:
      case DocumentType.ProformaInvoice: return 'Invoice #';
      case DocumentType.Quotation: return 'Quote #';
      case DocumentType.Statement: return 'Statement #';
      default: return 'Ref #';
    }
  };
  
  const getDueDateLabel = () => {
    if (isStatement) return 'Payment Due:';
    if (isQuotation) return 'Valid Until:';
    return 'Due Date:';
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('print-area');
    if (!element) return;

    setIsDownloadingPdf(true);
    element.classList.add('pdf-capture-mode');

    try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const imgWidth = pdfWidth;
        const imgHeight = imgWidth / ratio;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
            position = -heightLeft;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        const documentDisplayName = isContract ? contractDetails.contractType : documentType;
        const safeFilename = documentDisplayName.replace(/ \/ /g, '-').replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '');
        pdf.save(`${safeFilename}-${invoiceData.documentNumber}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Sorry, there was an error generating the PDF. Please try again.");
    } finally {
        element.classList.remove('pdf-capture-mode');
        setIsDownloadingPdf(false);
    }
  };

  const handleGeneratePdfBlob = async (): Promise<Blob> => {
    const element = document.getElementById('print-area');
    if (!element) throw new Error('Print area not found');

    element.classList.add('pdf-capture-mode');

    try {
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'pt', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const imgWidth = pdfWidth;
        const imgHeight = imgWidth / ratio;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
            position = -heightLeft;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }
        return pdf.output('blob');
    } catch (error) {
        console.error("Error generating PDF blob:", error);
        throw error;
    } finally {
        element.classList.remove('pdf-capture-mode');
    }
  };
  
  useImperativeHandle(ref, () => ({ handleDownloadPdf, handleGeneratePdfBlob }));

  const isEditableContract = isContract && contractDetails.generatedText !== 'Please click "Generate Contract" to create the agreement text.';
  const receiptTerms = "Thank you for your payment. Returns are accepted within 30 days of purchase with a valid receipt. Please contact us with any questions.";
  const shouldShowTermsBlock = (termsAndConditions && !isContract) || isReceipt;


  return (
    <div>
      <div className="mb-4 flex justify-end no-print">
        <button onClick={handleDownloadPdf} disabled={isDownloadingPdf} className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400 disabled:cursor-not-allowed">
            {isDownloadingPdf ? (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (<DownloadIcon className="h-5 w-5 mr-2" />)}
            {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
        </button>
      </div>
      <div id="print-area" className={`bg-white p-8 md:p-12 shadow-xl rounded-xl overflow-hidden ${templateClass}`}>
        {status === 'Paid' && <div className="paid-stamp">Paid</div>}
        <div className={`flex justify-between items-start pb-8 ${template === Template.Classic ? 'header-border' : 'border-b'}`}>
          <div>
            {logoUrl ? (<img src={logoUrl} alt="Company Logo" className="h-20 mb-4 object-contain" />) : (<div className="mb-4 flex items-center justify-center h-24 w-48 bg-slate-100 rounded text-slate-400"><LogoPlaceholderIcon className="h-12 w-12" /></div>)}
            <h2 className="text-3xl font-bold text-gray-800 capitalize">{documentTitle}</h2>
            <p className="text-gray-500 mt-1">{getReferenceLabel(documentType)} {invoiceData.documentNumber}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{from.isBusiness ? from.businessName : from.name}</p>
            <p className="text-gray-600">{from.address.split(',').map(line => <span key={line} className="block">{line.trim()}</span>)}</p>
            <p className="text-gray-600">{from.email}</p>
            <p className="text-gray-600">{from.phone}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
            <p className="font-bold text-gray-800">{to.isBusiness ? to.businessName : to.name}</p>
            <p className="text-gray-600">{to.address.split(',').map(line => <span key={line} className="block">{line.trim()}</span>)}</p>
            <p className="text-gray-600">{to.email}</p>
          </div>
          <div className="text-left md:text-right">
            <p><span className="font-semibold text-gray-600">{isStatement ? 'Statement Date:' : 'Issue Date:'}</span> {formatDate(invoiceData.issueDate)}</p>
            {documentType !== DocumentType.Receipt && !isContract && <p><span className="font-semibold text-gray-600">{getDueDateLabel()}</span> {formatDate(invoiceData.dueDate)}</p>}
            {isStatement && <p className="mt-2"><span className="font-semibold text-gray-600">Statement Period:</span><br/> {formatDate(invoiceData.statementPeriodStart || '')} to {formatDate(invoiceData.statementPeriodEnd || '')}</p>}
          </div>
        </div>
        
        {isContract ? (
          <>
            <div className="prose max-w-none text-gray-700">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Agreement Details</h3>
              {!isEditableContract ? (<div className="text-center py-8"><p className="text-slate-500 mb-4">The contract text has not been generated yet.</p><button onClick={onGenerateContract} disabled={isGenerating} className="inline-flex items-center justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400">{isGenerating ? (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : <SparklesIcon className="h-5 w-5 mr-2"/> }{isGenerating ? 'Generating...' : 'Generate Contract with AI'}</button></div>
              ) : (
                  <>
                    <div className="no-print">
                        <div className="flex items-center justify-end gap-2 mb-2">
                            <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"><UndoIcon className="h-5 w-5 text-slate-600" /></button>
                            <button onClick={handleRedo} disabled={historyIndex === historyLength - 1} className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"><RedoIcon className="h-5 w-5 text-slate-600" /></button>
                        </div>
                        <textarea value={editableText} onChange={handleTextChange} className="w-full h-96 p-4 border rounded-md font-mono text-sm bg-slate-50 focus:ring-slate-500 focus:border-slate-500" aria-label="Generated contract text"/>
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="font-semibold text-slate-700 flex items-center"><SparklesIcon className="h-5 w-5 mr-2 text-slate-500" /> Refine with AI</h4>
                            <p className="text-sm text-slate-500 mt-1 mb-3">Describe any changes you'd like to make to the contract above.</p>
                            <div className="flex gap-2">
                                <input type="text" value={refinementPrompt} onChange={(e) => setRefinementPrompt(e.target.value)} placeholder="e.g., Make the termination notice period 60 days." className="flex-grow p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"/>
                                <button onClick={async () => { await onRefineContract(refinementPrompt); setRefinementPrompt(''); }} disabled={isGenerating || !refinementPrompt} className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400">{isGenerating ? (<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : <SparklesIcon className="h-5 w-5 mr-2"/> }{isGenerating ? 'Refining...' : 'Refine'}</button>
                            </div>
                        </div>
                    </div>
                    <div className="print-only"><pre className="w-full font-sans text-sm whitespace-pre-wrap">{editableText}</pre></div>
                  </>
              )}
            </div>
            {isEditableContract && (<div className="mt-16 pt-8 border-t-2 border-gray-300 text-sm"><div className="grid grid-cols-2 gap-16"><div><p className="font-semibold">{from.isBusiness ? from.businessName : from.name}</p><div className="mt-16 mb-2 border-b border-gray-900"></div><p>(Authorized Signature)</p><p className="mt-4"><strong>Name:</strong> {from.name}</p><p className="mt-2"><strong>Title:</strong></p><p className="mt-2"><strong>Date:</strong></p><p className="mt-8 text-gray-500">[Company Stamp]</p></div><div><p className="font-semibold">{to.isBusiness ? to.businessName : to.name}</p><div className="mt-16 mb-2 border-b border-gray-900"></div><p>(Authorized Signature)</p><p className="mt-4"><strong>Name:</strong> {to.name}</p><p className="mt-2"><strong>Title:</strong></p><p className="mt-2"><strong>Date:</strong></p><p className="mt-8 text-gray-500">[Company Stamp]</p></div></div></div>)}
          </>
        ) : isStatement ? (<StatementBody invoiceData={invoiceData} subtotal={subtotal} statementTotal={total} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100 text-sm font-semibold text-gray-600 uppercase">
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-center">Unit</th>
                    <th className="p-3 text-right">Rate</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (<tr key={item.id} className="border-b"><td className="p-3">{item.description}</td><td className="p-3 text-right">{item.quantity}</td><td className="p-3 text-center">{item.unit || '-'}</td><td className="p-3 text-right">{formatCurrency(item.rate, currency)}</td><td className="p-3 text-right font-medium">{formatCurrency(item.quantity * item.rate, currency)}</td></tr>))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-8">
              <div className={`w-full md:w-1/2 lg:w-2/5 space-y-3 totals-container ${template === Template.Creative ? 'total-section' : ''}`}>
                <div className="flex justify-between text-base text-gray-600"><span>Subtotal</span><span className="font-medium text-gray-700 text-right">{formatCurrency(subtotal, currency)}</span></div>
                {taxRate > 0 && <div className="flex justify-between text-base text-gray-600"><span>Tax ({taxRate}%)</span><span className="font-medium text-gray-700 text-right">{formatCurrency(taxAmount, currency)}</span></div>}
                {discount > 0 && <div className="flex justify-between text-base text-gray-600"><span>Discount</span><span className="font-medium text-gray-700 text-right">- {formatCurrency(discount, currency)}</span></div>}
                <div className={`flex justify-between items-baseline text-xl font-bold text-gray-800 pt-3 ${template !== Template.Creative ? 'border-t mt-3' : ''}`}><span>Total</span><span className="text-right whitespace-nowrap">{formatCurrency(total, currency)}</span></div>
                {amountPaid > 0 && <div className="flex justify-between text-base text-gray-600 border-t pt-2 mt-2"><span className="font-medium">Amount Paid</span><span className="font-medium text-green-600 text-right">- {formatCurrency(amountPaid, currency)}</span></div>}
                {(amountPaid > 0 || status === 'Paid') && <div className={`flex justify-between items-baseline text-xl font-bold text-gray-800 pt-3`}><span>Balance Due</span><span className="text-right whitespace-nowrap">{formatCurrency(balanceDue, currency)}</span></div>}
              </div>
            </div>
          </>
        )}
        {(notes || showPaymentDetails || shouldShowTermsBlock) && (<div className="mt-12 pt-6 border-t">{notes && !isContract && (<div className="mb-6"><h4 className="font-semibold text-gray-600 mb-2">Notes</h4><p className="text-gray-500 text-sm">{notes}</p></div>)}{showPaymentDetails && (<div className="mb-6"><h4 className="font-semibold text-gray-600 mb-4">Payment Information</h4><div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm"><div><h5 className="font-medium text-gray-700 mb-1">Bank Details</h5><div className="text-gray-600 space-y-1"><p><strong>Bank:</strong> {paymentDetails.bankName}, {paymentDetails.branchName}</p><p><strong>Account Name:</strong> {paymentDetails.accountName}</p><p><strong>Account Number:</strong> {paymentDetails.accountNumber}</p>{paymentDetails.sortCode && <p><strong>Sort Code:</strong> {paymentDetails.sortCode}</p>}</div></div>{paymentDetails.momoNetwork && paymentDetails.momoAccountNumber && (<div><h5 className="font-medium text-gray-700 mb-1">Mobile Money (MoMo)</h5><div className="text-gray-600 space-y-1"><p><strong>Network:</strong> {paymentDetails.momoNetwork}</p><p><strong>Name:</strong> {paymentDetails.momoAccountName}</p><p><strong>Number:</strong> {paymentDetails.momoAccountNumber}</p></div><div className="text-xs text-gray-500 mt-2 space-y-1"><p><strong>Reference:</strong> Please use {getReferenceLabel(documentType)} {invoiceData.documentNumber}</p><p><strong>Note:</strong> Please ensure the name matches the Account Name before entering your PIN.</p></div></div>)}</div></div>)}{shouldShowTermsBlock && (<div className="mt-6 pt-6 border-t"><h4 className="font-semibold text-gray-600 mb-2">Terms & Conditions</h4><p className="text-gray-500 text-sm whitespace-pre-wrap">{isReceipt ? receiptTerms : termsAndConditions}</p></div>)}</div>)}
        <div className="mt-12 text-center text-gray-400 text-xs"><p>Generated with Datar Vault</p></div>
      </div>
    </div>
  );
});
