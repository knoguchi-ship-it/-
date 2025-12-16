import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ConsultationForm } from './components/ConsultationForm';
import { Consultation } from './types';

type ViewState = 'dashboard' | 'form';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedItem, setSelectedItem] = useState<Consultation | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const handleNewClick = () => {
    setSelectedItem(undefined);
    setView('form');
  };

  const handleEditClick = (item: Consultation) => {
    setSelectedItem(item);
    setView('form');
  };

  const handleCancel = () => {
    setView('dashboard');
    setSelectedItem(undefined);
  };

  const handleSaved = () => {
    setRefreshTrigger(prev => prev + 1);
    setView('dashboard');
    setSelectedItem(undefined);
    
    // Show Toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === 'dashboard' ? (
          <Dashboard 
            onNewClick={handleNewClick} 
            onEditClick={handleEditClick}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <div className="max-w-4xl mx-auto">
            <ConsultationForm 
              onCancel={handleCancel}
              onSaved={handleSaved}
              initialData={selectedItem}
            />
          </div>
        )}
      </main>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center transition-all duration-300 animate-bounce-short">
          <svg className="w-5 h-5 text-teal-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">保存しました</span>
        </div>
      )}
    </div>
  );
};

export default App;