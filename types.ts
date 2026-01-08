
export enum DocumentType {
  Invoice = 'Invoice',
  ProformaInvoice = 'Proforma Invoice',
  Receipt = 'Receipt',
  Quotation = 'Quotation',
  PurchaseOrder = 'Purchase Order',
  CreditNote = 'Credit Note',
  Statement = 'Statement of Account',
  Contract = 'Contract / Agreement',
}

export enum Template {
  Modern = 'Modern',
  Classic = 'Classic',
  Creative = 'Creative',
}

export enum InvoiceTemplate {
  Freelance = 'Freelance Services',
  ProductSale = 'Product Sale',
  Consulting = 'Consulting',
}

export enum ContractType {
  Service = 'Service Agreement',
  NDA = 'Non-Disclosure Agreement',
  Lease = 'Lease Agreement',
}

export interface PartyDetails {
  name: string;
  address: string;
  email: string;
  phone: string;
  isBusiness: boolean;
  businessName: string;
  taxId: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  unit?: string;
}

export interface ContractDetails {
  scopeOfWork: string;
  startDate: string;
  paymentTerms: string;
  jurisdiction: string;
  termLength: string;
  terminationClauseDetails: string;
  indemnification: string;
  generatedText: string;
  contractType: ContractType;
}

export interface PaymentDetails {
  bankName: string;
  branchName: string;
  accountNumber: string;
  accountName: string;
  sortCode: string;
  momoNetwork: string;
  momoAccountName: string;
  momoAccountNumber: string;
}

export type DocumentStatus = 'Draft' | 'Emailed' | 'Paid' | 'Partially Paid';

export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';
export type RecurringStatus = 'Active' | 'Ended';

export interface RecurringSettings {
  isRecurring: boolean;
  frequency: RecurringFrequency | null;
  startDate: string;
  endDate: string; // Optional, empty string if indefinite
  nextDueDate?: string;
  status?: RecurringStatus;
  customInterval?: number;
  customUnit?: 'days' | 'weeks' | 'months' | 'years';
  specificDaysOfWeek?: boolean;
  specificDaysOfMonth?: boolean;
  monthlyOnWeekday?: boolean;
}

export interface InvoiceData {
  documentType: DocumentType;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  from: PartyDetails;
  to: PartyDetails;
  items: LineItem[];
  notes: string;
  taxRate: number;
  discount: number;
  currency: string;
  logoUrl: string;
  contractDetails: ContractDetails;
  template: Template;
  selectedInvoiceTemplate: InvoiceTemplate;
  paymentDetails: PaymentDetails;
  termsAndConditions: string;
  openingBalance?: number;
  statementPeriodStart?: string;
  statementPeriodEnd?: string;
  status: DocumentStatus;
  amountPaid: number;
  recurringSettings?: RecurringSettings;
}

export interface ContractVersion {
  savedAt: string; // ISO string
  data: InvoiceData;
}

export interface LedgerEntry {
  id?: string;
  data: InvoiceData;
  lastModified: string; // ISO string;
  isRecurringTemplate?: boolean;
  createdAt?: string;
}

export interface DocumentLedger {
  [documentNumber: string]: LedgerEntry;
}

export interface SavedClient extends PartyDetails {
    id: string;
    tags?: string[];
    category?: string;
    notes?: string;
    creditLimit?: number;
    paymentTerms?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SavedItem {
    id: string;
    description: string;
    rate: number;
    unit?: string;
    sku?: string;
    category?: string;
    cost?: number;
    taxable: boolean;
    trackInventory?: boolean;
    quantityOnHand?: number;
    reorderPoint?: number;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export enum NotificationType {
  Overdue = 'Overdue',
  PaymentReminder = 'Payment Reminder',
  UpcomingDueDate = 'Upcoming Due Date',
}

export interface Notification {
  id: string;
  type: NotificationType;
  documentNumber: string;
  documentType: DocumentType;
  clientName: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysUntilDue: number;
}
