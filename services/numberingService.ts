
import { DocumentType } from '../types';

export const SEQUENCE_STORAGE_KEY = 'ai-doc-sequences';

interface YearlySequence {
  [year: number]: number;
}

interface Sequences {
  [key: string]: YearlySequence | number;
}

const getSequences = (): Sequences => {
  try {
    const storedSequences = localStorage.getItem(SEQUENCE_STORAGE_KEY);
    return storedSequences ? JSON.parse(storedSequences) : {};
  } catch (error) {
    console.error("Failed to parse sequences from local storage", error);
    return {};
  }
};

const saveSequences = (sequences: Sequences): void => {
  try {
    localStorage.setItem(SEQUENCE_STORAGE_KEY, JSON.stringify(sequences));
  } catch (error) {
    console.error("Failed to save sequences to local storage", error);
  }
};

const getDocPrefix = (docType: DocumentType): string => {
  switch (docType) {
    case DocumentType.Invoice: return 'INV';
    case DocumentType.ProformaInvoice: return 'PI';
    case DocumentType.Receipt: return 'REC';
    case DocumentType.Quotation: return 'QUO';
    case DocumentType.Statement: return 'SOA';
    case DocumentType.Contract: return 'CON';
    default: return 'DOC';
  }
};

export const getNextDocumentNumber = (docType: DocumentType): string => {
  const sequences = getSequences();
  const pad = (num: number) => String(num).padStart(3, '0');
  const prefix = getDocPrefix(docType);

  if (docType === DocumentType.Contract) {
    // Contracts have a simple, non-yearly sequence.
    const currentNumber = (sequences[docType] as number || 0);
    const nextNumber = currentNumber + 1;
    sequences[docType] = nextNumber;
    saveSequences(sequences);
    return `${prefix}-${pad(nextNumber)}`;
  } else {
    // Other documents have a year-based sequence.
    const currentYear = new Date().getFullYear();
    const yearlySequences = (sequences[docType] as YearlySequence || {}) as YearlySequence;
    
    const currentNumber = yearlySequences[currentYear] || 0;
    const nextNumber = currentNumber + 1;
    
    yearlySequences[currentYear] = nextNumber;
    sequences[docType] = yearlySequences;
    saveSequences(sequences);
    
    return `${prefix}-${currentYear}-${pad(nextNumber)}`;
  }
};
