
import React, { useState } from 'react';
import { SavedClient, PartyDetails } from '../types';
import { TrashIcon, PlusIcon, PencilIcon, SaveIcon } from './Icons';

interface ClientManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: SavedClient[];
  setClients: React.Dispatch<React.SetStateAction<SavedClient[]>>;
}

const emptyClient: Omit<SavedClient, 'id'> = {
  name: '', address: '', email: '', phone: '', isBusiness: false, businessName: '', taxId: ''
};

export const ClientManagerModal: React.FC<ClientManagerModalProps> = ({ isOpen, onClose, clients, setClients }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<SavedClient | null>(null);
  const [newClient, setNewClient] = useState<Omit<SavedClient, 'id'>>(emptyClient);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!newClient.name && !newClient.businessName) {
      alert('Please enter a name or business name.');
      return;
    }
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...editingClient, ...newClient } : c));
    } else {
      setClients([...clients, { ...newClient, id: Date.now().toString() }]);
    }
    setNewClient(emptyClient);
    setIsAdding(false);
    setEditingClient(null);
  };

  const handleEdit = (client: SavedClient) => {
    setEditingClient(client);
    setNewClient(client);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingClient(null);
    setNewClient(emptyClient);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      setNewClient(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const renderForm = () => (
    <div className="p-4 bg-slate-50 border rounded-lg mt-4 space-y-4">
        <h3 className="text-lg font-medium text-slate-800">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 md:col-span-2">
                <input type="checkbox" name="isBusiness" checked={newClient.isBusiness} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-slate-600 focus:ring-slate-500" />
                <span className="text-slate-700">This is a business</span>
            </label>
            {newClient.isBusiness ? (
                <>
                    <Input label="Company Name" name="businessName" value={newClient.businessName} onChange={handleInputChange} autoFocus={!editingClient} />
                    <Input label="Contact Person" name="name" value={newClient.name} onChange={handleInputChange} />
                    <Input label="Tax ID" name="taxId" value={newClient.taxId} onChange={handleInputChange} />
                </>
            ) : (
                <Input label="Full Name" name="name" value={newClient.name} onChange={handleInputChange} autoFocus={!editingClient} />
            )}
            <div className="md:col-span-2">
                <Textarea label="Address" name="address" value={newClient.address} onChange={handleInputChange} />
            </div>
            <Input label="Email" name="email" value={newClient.email} onChange={handleInputChange} />
            <Input label="Phone" name="phone" value={newClient.phone} onChange={handleInputChange} />
        </div>
        <div className="flex justify-end space-x-2">
            <button onClick={handleCancel} className="py-2 px-4 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 flex items-center">
                <SaveIcon className="h-5 w-5 mr-2" /> {editingClient ? 'Save Changes' : 'Save Client'}
            </button>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 no-print" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-800">Client Manager</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {!isAdding && (
            <button onClick={() => setIsAdding(true)} className="w-full flex items-center justify-center py-2 px-4 border border-dashed border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 mb-4">
                <PlusIcon className="h-5 w-5 mr-2" /> Add New Client
            </button>
          )}
          {isAdding && renderForm()}
          <div className="mt-4 space-y-2">
            {clients.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No clients saved yet.</p>
            ) : clients.map(client => (
                <div key={client.id} className="border rounded-lg p-3 flex justify-between items-center bg-white">
                    <div>
                        <p className="font-semibold text-slate-800">{client.isBusiness ? client.businessName : client.name}</p>
                        <p className="text-sm text-slate-500">{client.email}</p>
                    </div>
                    <div className="space-x-2">
                        <button onClick={() => handleEdit(client)} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full"><PencilIcon className="h-5 w-5"/></button>
                        <button onClick={() => handleDelete(client.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full"><TrashIcon className="h-5 w-5"/></button>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Re-usable input components to keep the form clean
const Input: React.FC<any> = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input {...props} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
  </div>
);

const Textarea: React.FC<any> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <textarea {...props} rows={2} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
    </div>
);
