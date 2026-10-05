import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RateTickerBar } from './components/RateTickerBar';
import { LoanCalculator } from './components/LoanCalculator';
import { DailyCompoundingView } from './components/DailyCompoundingView';
import { AmortizationTable } from './components/AmortizationTable';
import { BankComparison } from './components/BankComparison';
import { RatesExplorer } from './components/RatesExplorer';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import { MAS_BASELINE_RECORDS } from './data/masBaselineRates';
import {
  BackendIntegrationConfig,
  BankPackagePreset,
  LoanParams,
  SoraDailyRecord,
} from './types/sora';
import {
  calculateCompoundedSora,
  generateAmortizationSchedule,
} from './utils/soraMath';
import {
  DEFAULT_CONFIG,
  fetchSoraRates,
  loadBackendConfig,
  saveBackendConfig,
} from './services/masApiService';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [records, setRecords] = useState<SoraDailyRecord[]>(MAS_BASELINE_RECORDS);
  const [backendConfig, setBackendConfig] = useState<BackendIntegrationConfig>(DEFAULT_CONFIG);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Core loan parameters
  const [loanParams, setLoanParams] = useState<LoanParams>({
    principal: 600000,
    tenorYears: 25,
    benchmarkType: '3M',
    customSoraRate: 3.05,
    bankSpread: 0.70,
    applyStressTest: true,
    stressTestFloor: 4.00,
  });

  // Load config on mount
  useEffect(() => {
    const saved = loadBackendConfig();
    setBackendConfig(saved);
  }, []);

  const latestRecord = records[0] || MAS_BASELINE_RECORDS[0];

  // Calculate daily in-arrears compounded rate from records
  const { compoundedRate: dailyCompoundedRate } = calculateCompoundedSora(
    records,
    loanParams.principal
  );

  // Compute effective all-in rate for amortization
  const getEffectiveRate = (): number => {
    let benchmarkRate = latestRecord.compSora3M;
    if (loanParams.benchmarkType === '1M') benchmarkRate = latestRecord.compSora1M;
    else if (loanParams.benchmarkType === '3M') benchmarkRate = latestRecord.compSora3M;
    else if (loanParams.benchmarkType === '6M') benchmarkRate = latestRecord.compSora6M;
    else if (loanParams.benchmarkType === 'daily') benchmarkRate = dailyCompoundedRate;
    else if (loanParams.benchmarkType === 'custom') benchmarkRate = loanParams.customSoraRate;

    return Number((benchmarkRate + loanParams.bankSpread).toFixed(4));
  };

  const effectiveRate = getEffectiveRate();

  // Refresh handler
  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    try {
      const { records: newRecords, updatedConfig } = await fetchSoraRates(backendConfig);
      setRecords(newRecords);
      setBackendConfig(updatedConfig);
      saveBackendConfig(updatedConfig);
    } catch (err) {
      console.error('Error refreshing rates', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Apply bank package preset
  const handleApplyPackage = (pkg: BankPackagePreset) => {
    setLoanParams((prev) => ({
      ...prev,
      benchmarkType: pkg.fixedRatePromo ? 'custom' : pkg.benchmarkType,
      customSoraRate: pkg.fixedRatePromo || prev.customSoraRate,
      bankSpread: pkg.spreadYear1to3,
    }));
  };

  // Export Amortization Schedule to CSV
  const handleExportCsv = () => {
    const schedule = generateAmortizationSchedule(loanParams, effectiveRate);
    const headers = [
      'Month',
      'Year',
      'Date',
      'Beginning Balance (SGD)',
      'Monthly Payment (SGD)',
      'Principal Paid (SGD)',
      'Interest Paid (SGD)',
      'Ending Balance (SGD)',
      'Cumulative Interest (SGD)',
    ];

    const rows = schedule.monthlySchedule.map((r) => [
      r.monthIndex,
      r.yearIndex,
      `"${r.dateStr}"`,
      r.beginningBalance.toFixed(2),
      r.monthlyPayment.toFixed(2),
      r.principalPaid.toFixed(2),
      r.interestPaid.toFixed(2),
      r.endingBalance.toFixed(2),
      r.cumulativeInterest.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `SORA_Amortization_Schedule_${loanParams.principal}_${loanParams.tenorYears}Y.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header adhering strictly to Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendConfig={backendConfig}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        onExportCsv={handleExportCsv}
      />

      {/* 2. Rate Ticker Bar */}
      <RateTickerBar
        latestRecord={latestRecord}
        backendConfig={backendConfig}
        isRefreshing={isRefreshing}
        onRefresh={handleRefreshRates}
      />

      {/* 3. Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calculator' && (
          <LoanCalculator
            params={loanParams}
            onChangeParams={setLoanParams}
            latestRecord={latestRecord}
            dailyCompoundedRate={dailyCompoundedRate}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'daily-compounding' && (
          <DailyCompoundingView
            records={records}
            principalAmount={loanParams.principal}
            bankSpread={loanParams.bankSpread}
          />
        )}

        {activeTab === 'amortization' && (
          <AmortizationTable
            params={loanParams}
            effectiveRate={effectiveRate}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeTab === 'bank-packages' && (
          <BankComparison
            params={loanParams}
            latestRecord={latestRecord}
            onApplyPackage={handleApplyPackage}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'mas-rates' && <RatesExplorer records={records} />}
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">SORAcalc.sg</span>
            <span aria-hidden="true">·</span>
            <span>Singapore Monetary Authority Benchmark Calculator</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Formula: SC-STS In-Arrears Compounding</span>
            <span aria-hidden="true">·</span>
            <span>Actual/365 Convention</span>
          </div>
        </div>
      </footer>

      {/* 5. Backend Integration Modal */}
      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={backendConfig}
        onSaveConfig={(newConfig) => {
          setBackendConfig(newConfig);
          saveBackendConfig(newConfig);
        }}
        onTestConnection={handleRefreshRates}
      />
    </div>
  );
}
