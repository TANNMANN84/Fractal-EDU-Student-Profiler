
import React, { useState } from 'react';
import { AppProvider } from '../contexts/AppContext';
import ClassDashboard from '../components/ClassDashboard';
// FIX: Corrected import path for ManagementConsole to be explicit.
import ManagementConsole from '../components/ManagementConsole';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'console'>('dashboard');

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3">
              <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Fractal EDU - Student Profiler</h1>
              <div className="flex space-x-2 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-3 py-1.5 font-semibold text-sm rounded-md transition-all duration-200 ${
                    activeView === 'dashboard' ? 'bg-white dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-600/60'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveView('console')}
                  className={`px-3 py-1.5 font-semibold text-sm rounded-md transition-all duration-200 ${
                    activeView === 'console' ? 'bg-white dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-600/60'
                  }`}
                >
                  Management
                </button>
              </div>
            </div>
          </nav>
        </header>
        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          {activeView === 'dashboard' ? <ClassDashboard /> : <ManagementConsole />}
        </main>
      </div>
    </AppProvider>
  );
};

export default App;