import React from 'react';
import { ShieldAlert, ArrowRight, Sparkles, HelpCircle, Check, Info } from 'lucide-react';
import { LoanParams, SoraBenchmarkType, SoraDailyRecord } from '../types/sora';
import { formatPercent, formatSGD, formatSoraRate, calculateMonthlyRepayment } from '../utils/soraMath';

interface LoanCalculatorProps {
  params: LoanParams;
  onChangeParams: (updater: (prev: LoanParams) => LoanParams) => void;
  latestRecord?: SoraDailyRecord;
  dailyCompoundedRate: number;
  onNavigateToTab: (tabId: string) => void;
}

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({
  params,
  onChangeParams,
  latestRecord,
  dailyCompoundedRate,
  onNavigateToTab,
}) => {
  // Determine effective SORA benchmark rate based on selection
  const getSelectedSoraRate = (): number => {
    if (!latestRecord) return 3.05;
    switch (params.benchmarkType) {
      case '1M':
        return latestRecord.compSora1M;
      case '3M':
        return latestRecord.compSora3M;
      case '6M':
        return latestRecord.compSora6M;
      case 'daily':
        return dailyCompoundedRate;
      case 'custom':
        return params.customSoraRate;
      default:
        return latestRecord.compSora3M;
    }
  };

  const benchmarkSoraRate = getSelectedSoraRate();
  const effectiveAllInRate = Number((benchmarkSoraRate + params.bankSpread).toFixed(4));

  // Regular monthly repayment
  const monthlyPayment = calculateMonthlyRepayment(
    params.principal,
    effectiveAllInRate,
    params.tenorYears
  );

  const totalRepayment = monthlyPayment * params.tenorYears * 12;
  const totalInterest = Math.max(0, totalRepayment - params.principal);

  // First month breakdown
  const firstMonthInterest = (params.principal * (effectiveAllInRate / 100)) / 12;
  const firstMonthPrincipal = Math.max(0, monthlyPayment - firstMonthInterest);

  // MAS Stress-test calculation (4.0% floor per MAS mortgage guidelines)
  const stressAllInRate = Math.max(params.stressTestFloor, effectiveAllInRate);
  const stressMonthlyPayment = calculateMonthlyRepayment(
    params.principal,
    stressAllInRate,
    params.tenorYears
  );
  const stressMonthlyBuffer = Math.max(0, stressMonthlyPayment - monthlyPayment);

  const principalPresets = [
    { label: 'S$ 300k', value: 300000, desc: 'HDB 3/4-Rm' },
    { label: 'S$ 500k', value: 500000, desc: 'HDB 5-Rm' },
    { label: 'S$ 800k', value: 800000, desc: 'EC / Resale' },
    { label: 'S$ 1.2M', value: 1200000, desc: 'Condo' },
    { label: 'S$ 1.8M', value: 1800000, desc: 'Prime / Landed' },
  ];

  const bankSpreadPresets = [
    { label: 'DBS (+0.65%)', value: 0.65 },
    { label: 'UOB (+0.68%)', value: 0.68 },
    { label: 'OCBC (+0.70%)', value: 0.70 },
    { label: 'SCB (+0.75%)', value: 0.75 },
  ];

  return (
    <div className="space-y-8">
      {/* Top Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Singapore SORA Loan & Mortgage Calculator
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Accurately calculate monthly interest and principal payments referencing official Monetary Authority of Singapore (MAS) overnight benchmarks and compounded tenors.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Day Count: Actual/365</span>
          <span aria-hidden="true">·</span>
          <span>Currency: SGD</span>
          <span aria-hidden="true">·</span>
          <span>TDSR Compliant</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Loan Principal Input */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="principal-input" className="text-sm font-semibold text-slate-900">
                Loan Principal (SGD)
              </label>
              <span className="font-mono text-xs text-slate-500 font-medium">
                {formatSGD(params.principal)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                S$
              </span>
              <input
                id="principal-input"
                type="number"
                min="10000"
                max="20000000"
                step="10000"
                value={params.principal}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  onChangeParams((prev) => ({ ...prev, principal: val }));
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-semibold text-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tabular-nums"
              />
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
              {principalPresets.map((preset) => {
                const isSelected = params.principal === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onChangeParams((prev) => ({ ...prev, principal: preset.value }))}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div>{preset.label}</div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {preset.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Loan Tenor */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="tenor-input" className="text-sm font-semibold text-slate-900">
                  Loan Tenor
                </label>
                <p className="text-xs text-slate-500">Max 30 yrs for HDB, 35 yrs for private properties</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-bold text-slate-900">
                  {params.tenorYears} Years
                </span>
                <span className="text-xs text-slate-400 block font-mono">
                  ({params.tenorYears * 12} installments)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <input
                id="tenor-input"
                type="range"
                min="5"
                max="35"
                step="1"
                value={params.tenorYears}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChangeParams((prev) => ({ ...prev, tenorYears: val }));
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>5 Yrs</span>
                <span>15 Yrs</span>
                <span>25 Yrs (Standard)</span>
                <span>30 Yrs</span>
                <span>35 Yrs</span>
              </div>
            </div>
          </div>

          {/* 3. Benchmark Selection */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-slate-900">
                  MAS SORA Benchmark Reference
                </label>
                <p className="text-xs text-slate-500">
                  Published by MAS every Singapore business day at 9:00am
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('daily-compounding')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                Inspect compounding formula
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: '3M',
                  name: '3-Month Compounded',
                  rate: latestRecord?.compSora3M ?? 3.078,
                  badge: 'Most Popular',
                },
                {
                  id: '1M',
                  name: '1-Month Compounded',
                  rate: latestRecord?.compSora1M ?? 3.0425,
                  badge: 'Monthly Reset',
                },
                {
                  id: '6M',
                  name: '6-Month Compounded',
                  rate: latestRecord?.compSora6M ?? 3.112,
                  badge: 'Semi-Annual',
                },
                {
                  id: 'daily',
                  name: 'Daily In-Arrears',
                  rate: dailyCompoundedRate,
                  badge: 'Exact Daily',
                },
              ].map((bench) => {
                const isSelected = params.benchmarkType === bench.id;
                return (
                  <button
                    key={bench.id}
                    type="button"
                    onClick={() =>
                      onChangeParams((prev) => ({
                        ...prev,
                        benchmarkType: bench.id as SoraBenchmarkType,
                      }))
                    }
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[11px] font-medium text-slate-500 truncate">
                      {bench.name}
                    </div>
                    <div className="font-mono font-bold text-base text-slate-900 mt-0.5 tabular-nums">
                      {formatSoraRate(bench.rate)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">
                      {bench.badge}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom SORA Rate Option */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-600">Simulate custom benchmark rate:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChangeParams((prev) => ({
                      ...prev,
                      benchmarkType: prev.benchmarkType === 'custom' ? '3M' : 'custom',
                    }))
                  }
                  className={`px-2.5 py-1 rounded font-medium cursor-pointer border ${
                    params.benchmarkType === 'custom'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Custom Rate
                </button>
                {params.benchmarkType === 'custom' && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="15"
                      step="0.01"
                      value={params.customSoraRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onChangeParams((prev) => ({ ...prev, customSoraRate: val }));
                      }}
                      className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded font-mono text-xs text-right font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-slate-500">%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Bank Spread (Margin) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="spread-input" className="text-sm font-semibold text-slate-900">
                  Bank Spread / Margin (% p.a.)
                </label>
                <p className="text-xs text-slate-500">
                  Fixed markup charged by the Singapore lending bank
                </p>
              </div>
              <div className="flex items-center gap-1 font-mono font-bold text-base text-slate-900">
                <span>+</span>
                <span>{params.bankSpread.toFixed(2)}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <input
                id="spread-input"
                type="range"
                min="0.40"
                max="1.50"
                step="0.01"
                value={params.bankSpread}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onChangeParams((prev) => ({ ...prev, bankSpread: val }));
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>+0.40% (Promo)</span>
                <span>+0.65% (DBS)</span>
                <span>+0.85% (Yr 4+)</span>
                <span>+1.50%</span>
              </div>
            </div>

            {/* Quick Bank Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {bankSpreadPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onChangeParams((prev) => ({ ...prev, bankSpread: preset.value }))}
                  className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer border ${
                    params.bankSpread === preset.value
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. MAS TDSR Stress-Test Toggle */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
            <input
              id="stress-test-toggle"
              type="checkbox"
              checked={params.applyStressTest}
              onChange={(e) =>
                onChangeParams((prev) => ({ ...prev, applyStressTest: e.target.checked }))
              }
              className="mt-1 h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1 text-xs">
              <label htmlFor="stress-test-toggle" className="font-semibold text-slate-900 cursor-pointer block">
                Enable MAS Regulatory Stress-Test Rate Floor (4.00% p.a.)
              </label>
              <p className="text-slate-500 mt-0.5">
                The Monetary Authority of Singapore mandates residential mortgages to be assessed at a minimum medium-term interest rate floor of 4.0% for Total Debt Servicing Ratio (TDSR) eligibility.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Key Results & Financial Analytics (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Calculation Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Estimated Monthly Repayment
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tabular-nums tracking-tight">
                  {formatSGD(monthlyPayment)}
                </span>
                <span className="text-sm font-medium text-slate-500">/ month</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
                <span>Principal: {formatSGD(params.principal, true)}</span>
                <span>·</span>
                <span>Tenor: {params.tenorYears} yrs</span>
              </div>
            </div>

            {/* Interest Rate Formula Badge */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">All-In Effective Rate:</span>
                <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                  {formatPercent(effectiveAllInRate)} p.a.
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{params.benchmarkType.toUpperCase()} SORA ({formatSoraRate(benchmarkSoraRate)})</span>
                <span>+</span>
                <span>Bank Margin ({formatPercent(params.bankSpread)})</span>
              </div>
            </div>

            {/* Month 1 Breakdown Visualizer */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>First Installment Composition</span>
                <span className="text-slate-500 font-mono">100%</span>
              </div>

              {/* Stacked bar */}
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(firstMonthPrincipal / monthlyPayment) * 100}%` }}
                  className="bg-blue-600 h-full transition-all"
                  title={`Principal: ${formatSGD(firstMonthPrincipal)}`}
                />
                <div
                  style={{ width: `${(firstMonthInterest / monthlyPayment) * 100}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`Interest: ${formatSGD(firstMonthInterest)}`}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                  <span className="text-slate-600">Principal:</span>
                  <strong className="text-slate-900 font-mono">{formatSGD(firstMonthPrincipal)}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span className="text-slate-600">Interest:</span>
                  <strong className="text-slate-900 font-mono">{formatSGD(firstMonthInterest)}</strong>
                </div>
              </div>
            </div>

            {/* Total Life of Loan Summary */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Total Interest Payable:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {formatSGD(totalInterest)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Total Loan Repayment:</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {formatSGD(totalRepayment)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Total Number of Payments:</span>
                <span className="font-mono font-medium text-slate-700">
                  {params.tenorYears * 12} monthly installments
                </span>
              </div>
            </div>

            {/* Stress Test Indicator (if enabled) */}
            {params.applyStressTest && (
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  MAS 4.00% Stress Floor Assessment
                </div>
                <div className="text-xs text-amber-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Stress-Tested Installment:</span>
                    <strong className="font-mono">{formatSGD(stressMonthlyPayment)}/mo</strong>
                  </div>
                  <div className="flex justify-between text-amber-900">
                    <span>Required Cash Buffer:</span>
                    <strong className="font-mono">+{formatSGD(stressMonthlyBuffer)}/mo</strong>
                  </div>
                </div>
                <p className="text-[11px] text-amber-700 pt-1 border-t border-amber-200/60 leading-relaxed">
                  To pass Singapore TDSR (55% debt cap), your monthly household income must cover this stressed amount along with other debt obligations.
                </p>
              </div>
            )}

            {/* Action buttons to deeper modules */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('amortization')}
                className="flex-1 py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View Full Amortization</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateToTab('bank-packages')}
                className="py-2.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Compare Banks
              </button>
            </div>
          </div>

          {/* Quick Informational Guide */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-blue-900">
              <Info className="w-4 h-4 text-blue-600" />
              Why SORA is Singapore's Default Benchmark
            </div>
            <p className="leading-relaxed">
              SORA replaced SIBOR and SOR under MAS guidance. Because SORA is computed from actual interbank transactions rather than subjective quotes, it offers unprecedented transparency with no foreign exchange risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
