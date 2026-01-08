
import { InvoiceData, DocumentType, LineItem, Template, ContractType, ContractDetails, RecurringSettings } from './types';

export const DOCUMENT_TYPES: DocumentType[] = [
  DocumentType.Invoice,
  DocumentType.ProformaInvoice,
  DocumentType.Receipt,
  DocumentType.Quotation,
  DocumentType.Statement,
  DocumentType.Contract,
];

export const TEMPLATES: Template[] = [
  Template.Modern,
  Template.Classic,
  Template.Creative,
];

export const CONTRACT_TYPES: ContractType[] = [
  ContractType.Service,
  ContractType.NDA,
  ContractType.Lease,
];

export const CURRENCIES = [
  { code: 'USD', display: 'USD ($)' },
  { code: 'EUR', display: 'EUR (€)' },
  { code: 'GBP', display: 'GBP (£)' },
  { code: 'JPY', display: 'JPY (¥)' },
  { code: 'CAD', display: 'CAD ($)' },
  { code: 'AUD', display: 'AUD ($)' },
  { code: 'GHS', display: 'GHS (₵)' },
];

export const CONTRACT_TEMPLATES: Record<ContractType, Omit<ContractDetails, 'contractType' | 'generatedText'>> = {
    [ContractType.Service]: {
        scopeOfWork: "Clearly describe the services. E.g., 'Web design for a 5-page corporate website, including features X, Y, and Z. Three rounds of revisions are included.'",
        startDate: new Date().toISOString().split('T')[0],
        paymentTerms: "Detail the payment schedule. E.g., '50% upfront deposit of $1,000. 50% final payment of $1,000 due upon project completion. Payments via bank transfer.'",
        jurisdiction: 'e.g., State of California, USA',
        termLength: "Specify the contract's duration. E.g., 'This agreement is effective for 12 months from the start date.'",
        terminationClauseDetails: "State how the contract can be ended. E.g., 'Either party may terminate with 30 days written notice. Client will pay for all work completed up to the termination date.'",
        indemnification: "Specify who is responsible for legal claims. E.g., 'Client agrees to indemnify Provider against claims arising from materials provided by the Client (e.g., images, text).'",
    },
    [ContractType.NDA]: {
        scopeOfWork: "Define the purpose of sharing confidential info. E.g., 'To explore a potential business partnership' or 'To evaluate the Discloser's software for a potential license.'",
        startDate: new Date().toISOString().split('T')[0],
        paymentTerms: 'Not applicable for most NDAs.',
        jurisdiction: 'e.g., State of New York, USA',
        termLength: "Specify how long confidentiality lasts. E.g., 'The duty to protect confidential information will remain in effect for 5 years from the Effective Date.'",
        terminationClauseDetails: "Describe how the NDA ends. E.g., 'This Agreement can be terminated with 15 days written notice, though confidentiality obligations shall survive termination.'",
        indemnification: 'e.g., The disclosing party is entitled to seek injunctive relief for any breach of this agreement.',
    },
    [ContractType.Lease]: {
        scopeOfWork: "Describe the property being leased. E.g., 'The residential property at 123 Main St, Anytown, USA, including two bedrooms, one bathroom, and one parking space.'",
        startDate: new Date().toISOString().split('T')[0],
        paymentTerms: "Specify rent and deposit. E.g., 'Monthly rent of $2,000 is due on the 1st of each month. A security deposit of $2,000 is due upon signing.'",
        jurisdiction: 'e.g., State of Texas, USA',
        termLength: 'e.g., A fixed term of 12 months, beginning on the start date.',
        terminationClauseDetails: "Explain conditions for ending the lease. E.g., 'Tenant may terminate early by providing 60 days written notice and paying a fee equal to one month's rent.'",
        indemnification: 'e.g., Tenant is responsible for any damage to the property caused by them or their guests, excluding normal wear and tear.',
    }
};

export const DEFAULT_LINE_ITEM: LineItem = {
  id: Date.now().toString(),
  description: 'Design Services',
  quantity: 10,
  rate: 80,
  unit: 'hours',
};

const today = new Date();
const lastMonth = new Date();
lastMonth.setMonth(today.getMonth() - 1);

const DEFAULT_RECURRING_SETTINGS: RecurringSettings = {
  isRecurring: false,
  frequency: null,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  customInterval: undefined,
  customUnit: 'days',
  specificDaysOfWeek: false,
  specificDaysOfMonth: false,
  monthlyOnWeekday: false,
};

export const DEFAULT_INVOICE_DATA: InvoiceData = {
  documentType: DocumentType.Invoice,
  documentNumber: '001',
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
  from: {
    name: 'Your Name',
    isBusiness: true,
    businessName: 'Your Company LLC',
    address: '123 Creative Lane, Suite 100, Art City, 54321',
    email: 'contact@yourcompany.com',
    phone: '(555) 123-4567',
    taxId: 'TAXID123456',
  },
  to: {
    name: 'Client Name',
    isBusiness: true,
    businessName: 'Client Corp',
    address: '456 Business Ave, Industry Town, 12345',
    email: 'billing@clientcorp.com',
    phone: '(555) 765-4321',
    taxId: 'TAXID654321',
  },
  items: [DEFAULT_LINE_ITEM],
  notes: '',
  taxRate: 8,
  discount: 0,
  currency: 'GHS',
  logoUrl: 'https://picsum.photos/seed/logo/150/50',
  template: Template.Modern,
  contractDetails: {
    contractType: ContractType.Service,
    ...CONTRACT_TEMPLATES[ContractType.Service],
    generatedText: 'Please click "Generate Contract" to create the agreement text.',
  },
  paymentDetails: {
    bankName: 'Global Standard Bank',
    branchName: 'City Center Branch',
    accountNumber: '1234567890123',
    accountName: 'Your Company LLC',
    sortCode: '12-34-56',
    momoNetwork: 'MTN',
    momoAccountName: 'Your Company LLC',
    momoAccountNumber: '055 XXX XXXX',
  },
  termsAndConditions: 'All payments are due within 30 days of the invoice date. Late payments may be subject to a 5% monthly fee.',
  openingBalance: 0,
  statementPeriodStart: lastMonth.toISOString().split('T')[0],
  statementPeriodEnd: today.toISOString().split('T')[0],
  status: 'Draft',
  amountPaid: 0,
  recurringSettings: DEFAULT_RECURRING_SETTINGS,
};
