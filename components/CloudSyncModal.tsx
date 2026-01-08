import React, { useState, useEffect } from 'react';
import { DocumentLedger, SavedClient, SavedItem } from '../types';
import { syncDataToSupabase, syncDataFromSupabase, getCurrentUser, signInUser, signUpUser, signOutUser, initializeDatabase } from '../services/supabaseService.ts';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledger: DocumentLedger;
  clients: SavedClient[];
  items: SavedItem[];
  onSyncComplete: (data: { ledger: DocumentLedger; clients: SavedClient[]; items: SavedItem[] }) => void;
}

interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  isLoading: boolean;
  error: string | null;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  ledger,
  clients,
  items,
  onSyncComplete
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userEmail: null,
    isLoading: true,
    error: null
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    }
  }, [isOpen]);

  const checkAuthStatus = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const user = await getCurrentUser();

      if (user) {
        setAuthState({
          isAuthenticated: true,
          userEmail: user.email,
          isLoading: false,
          error: null
        });
        // Load last sync time from localStorage
        const lastSync = localStorage.getItem('supabaseLastSync');
        setLastSyncTime(lastSync);
      } else {
        setAuthState({
          isAuthenticated: false,
          userEmail: null,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        isAuthenticated: false,
        userEmail: null,
        isLoading: false,
        error: 'Failed to check authentication status'
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      if (isSignUp) {
        await signUpUser(email, password, name);
      } else {
        await signInUser(email, password);
      }

      // Check auth status again to update UI
      await checkAuthStatus();
    } catch (error) {
      console.error('Auth error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await signOutUser();
      await checkAuthStatus();
    } catch (error) {
      console.error('Sign out error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      }));
    }
  };

  const handleSyncToCloud = async () => {
    try {
      setSyncStatus('syncing');
      setAuthState(prev => ({ ...prev, error: null }));

      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      await syncDataToSupabase(user.id, {
        ledger,
        clients,
        items
      });

      // Update last sync time
      const now = new Date().toISOString();
      localStorage.setItem('supabaseLastSync', now);
      setLastSyncTime(now);

      setSyncStatus('success');
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  };

  const handleSyncFromCloud = async () => {
    try {
      setSyncStatus('syncing');
      setAuthState(prev => ({ ...prev, error: null }));

      const user = await getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const syncedData = await syncDataFromSupabase(user.id);

      // Update last sync time
      const now = new Date().toISOString();
      localStorage.setItem('supabaseLastSync', now);
      setLastSyncTime(now);

      setSyncStatus('success');
      onSyncComplete(syncedData);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 no-print" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-semibold text-slate-800">Cloud Sync & Backup</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-grow">
          {!authState.isAuthenticated ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-700">Sign in to enable cloud sync</h3>
                <p className="text-slate-500 text-sm">Securely backup and sync your data across devices</p>
              </div>

              {authState.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {authState.error}
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authState.isLoading}
                  className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-400"
                >
                  {authState.isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </button>

                <div className="text-center text-sm text-slate-500">
                  {isSignUp ? 'Already have an account? ' : 'Need an account? '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-slate-700 hover:text-slate-900 font-medium"
                  >
                    {isSignUp ? 'Sign In' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-700">Cloud Sync Ready</h3>
                <p className="text-slate-500 text-sm">Signed in as {authState.userEmail}</p>
                {lastSyncTime && (
                  <p className="text-slate-400 text-xs mt-1">Last sync: {formatDate(lastSyncTime)}</p>
                )}
              </div>

              {authState.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                  {authState.error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleSyncToCloud}
                  disabled={syncStatus === 'syncing' || authState.isLoading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                >
                  {syncStatus === 'syncing' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      Upload to Cloud
                    </>
                  )}
                </button>

                <button
                  onClick={handleSyncFromCloud}
                  disabled={syncStatus === 'syncing' || authState.isLoading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
                >
                  {syncStatus === 'syncing' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Syncing...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Download from Cloud
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleSignOut}
                  disabled={authState.isLoading}
                  className="w-full flex items-center justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-100"
                >
                  {authState.isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </>
                  )}
                </button>

                <button
                  onClick={checkAuthStatus}
                  disabled={authState.isLoading}
                  className="w-full flex items-center justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:bg-slate-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" />
                  </svg>
                  Refresh Status
                </button>
              </div>

              {syncStatus === 'success' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sync completed successfully!
                </div>
              )}

              {syncStatus === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sync failed. Please try again.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};