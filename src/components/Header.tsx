import React from 'react';
import { Server, Download, SlidersHorizontal } from 'lucide-react';
import { BackendIntegrationConfig } from '../types/sora';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  backendConfig: BackendIntegrationConfig;
  onOpenBackendModal: () => void;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  backendConfig,
  onOpenBackendModal,
  onExportCsv,
}) => {
  const navItems = [
    { id: 'calculator', label: 'Loan Calculator' },
    { id: 'daily-compounding', label: 'Daily Compounding' },
    { id: 'amortization', label: 'Amortization' },
    { id: 'bank-packages', label: 'Bank Packages' },
    { id: 'mas-rates', label: 'MAS Rates Explorer' },
  ];

  const isCustomBackend = backendConfig.mode === 'custom-backend';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('calculator')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
              SORA<span className="text-blue-600">calc</span><span className="text-slate-400 text-sm font-normal">.sg</span>
            </span>
          </button>
        </div>

        {/* Zone 2: 4-5 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-4 lg:gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative py-1 px-1 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-blue-600 font-semibold after:absolute after:bottom-[-19px] after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenBackendModal}
            title="Configure Backend Integration"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs whitespace-nowrap"
          >
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Backend API</span>
            <span
              className={`w-2 h-2 rounded-full ${
                backendConfig.status === 'synced'
                  ? 'bg-emerald-500 ring-2 ring-emerald-100'
                  : backendConfig.status === 'connecting'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-blue-500'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            title="Export Amortization Schedule to CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar for small screens */}
      <div className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
              activeTab === item.id
                ? 'bg-white text-blue-700 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
