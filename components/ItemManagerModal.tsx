
import React, { useState } from 'react';
import { SavedItem } from '../types';
import { TrashIcon, PlusIcon, PencilIcon, SaveIcon } from './Icons';

interface ItemManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SavedItem[];
  setItems: React.Dispatch<React.SetStateAction<SavedItem[]>>;
  currency: string;
}

const emptyItem: Omit<SavedItem, 'id'> = {
  description: '', rate: 0, unit: ''
};

const formatCurrency = (amount: number, currency: string) => {
  try {
    const locale = currency === 'GHS' ? 'en-GH' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    if (currency === 'GHS') {
      return formatted.replace(/GH₵/g, '₵').replace(/GHS/g, '₵');
    }
    return formatted;
  } catch (e) {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export const ItemManagerModal: React.FC<ItemManagerModalProps> = ({ isOpen, onClose, items, setItems, currency }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<SavedItem | null>(null);
  const [newItem, setNewItem] = useState<Omit<SavedItem, 'id'>>(emptyItem);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!newItem.description) {
      alert('Please enter a description.');
      return;
    }
    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...editingItem, ...newItem } : i));
    } else {
      setItems([...items, { ...newItem, id: Date.now().toString() }]);
    }
    setNewItem(emptyItem);
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleEdit = (item: SavedItem) => {
    setEditingItem(item);
    setNewItem(item);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingItem(null);
    setNewItem(emptyItem);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setNewItem(prev => ({ ...prev, [name]: name === 'rate' ? parseFloat(value) || 0 : value }));
  };

  const renderForm = () => (
    <div className="p-4 bg-slate-50 border rounded-lg mt-4 space-y-4">
        <h3 className="text-lg font-medium text-slate-800">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
                <Input label="Description" name="description" value={newItem.description} onChange={handleInputChange} autoFocus={!editingItem} />
            </div>
            <Input label="Rate" name="rate" type="number" value={newItem.rate} onChange={handleInputChange} />
            <Input label="Unit (e.g., hours, pcs)" name="unit" value={newItem.unit || ''} onChange={handleInputChange} />
        </div>
        <div className="flex justify-end space-x-2">
            <button onClick={handleCancel} className="py-2 px-4 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 flex items-center">
                <SaveIcon className="h-5 w-5 mr-2" /> {editingItem ? 'Save Changes' : 'Save Item'}
            </button>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 no-print" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Item Manager</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {!isAdding && (
            <button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center py-2 px-4 border border-dashed border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 mb-4">
                <PlusIcon className="h-5 w-5 mr-2" /> Add New Item/Service
            </button>
          )}
          {isAdding && renderForm()}
          <div className="mt-4 space-y-2">
            {items.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No items saved yet.</p>
            ) : items.map(item => (
                <div key={item.id} className="border rounded-lg p-3 flex justify-between items-center bg-white">
                    <div>
                        <p className="font-semibold text-slate-800">{item.description}</p>
                        <p className="text-sm text-slate-500">{formatCurrency(item.rate, currency)} {item.unit ? `/ ${item.unit}` : ''}</p>
                    </div>
                    <div className="space-x-2">
                        <button onClick={() => handleEdit(item)} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full"><PencilIcon className="h-5 w-5"/></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full"><TrashIcon className="h-5 w-5"/></button>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Input: React.FC<any> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input {...props} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
  </div>
);
