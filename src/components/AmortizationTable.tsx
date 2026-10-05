import React, { useState } from 'react';
import { Download, Plus, Trash2, Calendar, PiggyBank, ArrowDown, ChevronRight, Layers } from 'lucide-react';
import { LoanParams } from '../types/sora';
import { formatPercent, formatSGD, generateAmortizationSchedule } from '../utils/soraMath';

interface AmortizationTableProps {
  params: LoanParams;
  effectiveRate: number;
  onExportCsv: () => void;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  params,
  effectiveRate,
  onExportCsv,
}) => {
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');
  const [prepayments, setPrepayments] = useState<{ month: number; amount: number }[]>([]);
  const [newPrepayMonth, setNewPrepayMonth] = useState<number>(24); // default Month 24 (Year 2)
  const [newPrepayAmount, setNewPrepayAmount] = useState<number>(20000); // default S$ 20,000
  const [monthlyLimit, setMonthlyLimit] = useState<number>(60); // Show first 5 years initially for fast render

  // Baseline schedule without prepayments
  const baseline = generateAmortizationSchedule(params, effectiveRate, []);

  // Schedule with user's prepayments
  const withPrepay = generateAmortizationSchedule(params, effectiveRate, prepayments);

  const interestSaved = Math.max(0, baseline.totalInterestPaid - withPrepay.totalInterestPaid);
  const monthsSaved = Math.max(0, baseline.actualMonthsToPayoff - withPrepay.actualMonthsToPayoff);
  const yearsSaved = (monthsSaved / 12).toFixed(1);

  const handleAddPrepayment = () => {
    if (newPrepayAmount <= 0 || newPrepayMonth <= 0) return;
    setPrepayments((prev) => [...prev, { month: newPrepayMonth, amount: newPrepayAmount }]);
  };

  const handleRemovePrepayment = (idx: number) => {
    setPrepayments((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Amortization Schedule & Prepayment Simulator
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Detailed schedule of principal reduction, interest allocation, and savings analysis from lump-sum repayments at an effective rate of {formatPercent(effectiveRate)} p.a.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Segmented view switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('yearly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'yearly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly Summary
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Log
            </button>
          </div>

          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Prepayment Planner Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-semibold text-slate-900">
              Lump-Sum Prepayment Simulator
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Simulate partial capital payoffs and calculate interest saved
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Prepayment Month</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={params.tenorYears * 12}
                value={newPrepayMonth}
                onChange={(e) => setNewPrepayMonth(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap font-mono">
                (Yr {Math.ceil(newPrepayMonth / 12)})
              </span>
            </div>
          </div>

          <div className="md:col-span-5 space-y-1">
            <label className="text-xs font-semibold text-slate-700">Lump-Sum Amount (SGD)</label>
            <input
              type="number"
              min="1000"
              step="5000"
              value={newPrepayAmount}
              onChange={(e) => setNewPrepayAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleAddPrepayment}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Prepayment</span>
            </button>
          </div>
        </div>

        {/* Active Prepayments List */}
        {prepayments.length > 0 && (
          <div className="pt-2 space-y-2">
            <div className="text-xs font-semibold text-slate-700">Configured Prepayments:</div>
            <div className="flex flex-wrap gap-2">
              {prepayments.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-mono"
                >
                  <span>
                    Month {p.month} (Yr {Math.ceil(p.month / 12)}):{' '}
                    <strong>{formatSGD(p.amount)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePrepayment(idx)}
                    className="text-emerald-700 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Savings Banner */}
            <div className="mt-3 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-emerald-700 block">Total Interest Saved:</span>
                <span className="text-2xl font-bold font-mono text-emerald-900 tabular-nums">
                  {formatSGD(interestSaved)}
                </span>
              </div>
              <div>
                <span className="text-xs text-emerald-700 block">Loan Tenor Shortened By:</span>
                <span className="text-2xl font-bold font-mono text-emerald-900 tabular-nums">
                  {monthsSaved} Months ({yearsSaved} yrs)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Amortization Trajectory Chart (SVG) */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Loan Balance Trajectory Over {params.tenorYears} Years
            </h3>
            <p className="text-xs text-slate-500">
              Principal reduction vs cumulative interest payments
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span className="text-slate-600">Remaining Balance</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="text-slate-600">Cumulative Interest</span>
            </span>
          </div>
        </div>

        {/* Custom Responsive SVG Chart */}
        <div className="w-full h-48 sm:h-56 relative pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="70" x2="600" y2="70" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="120" x2="600" y2="120" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="170" x2="600" y2="170" stroke="#e2e8f0" strokeWidth="1.5" />

            {/* Path for Remaining Loan Balance */}
            {(() => {
              const years = withPrepay.yearlySummary;
              if (years.length === 0) return null;
              const maxVal = params.principal * 1.05;

              const points = years.map((y, idx) => {
                const x = (idx / (years.length - 1 || 1)) * 600;
                const yPos = 170 - (y.endingBalance / maxVal) * 150;
                return `${x},${yPos}`;
              });

              // Add start point
              const fullPoints = `0,${170 - (params.principal / maxVal) * 150} ${points.join(' ')}`;
              const areaPoints = `0,170 0,${170 - (params.principal / maxVal) * 150} ${points.join(' ')} 600,170`;

              return (
                <>
                  <polygon points={areaPoints} fill="rgba(37, 99, 235, 0.08)" />
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={fullPoints}
                  />
                </>
              );
            })()}

            {/* Path for Cumulative Interest */}
            {(() => {
              const years = withPrepay.yearlySummary;
              if (years.length === 0) return null;
              const maxVal = params.principal * 1.05;
              let cumInterest = 0;

              const points = years.map((y, idx) => {
                cumInterest += y.interestPaid;
                const x = (idx / (years.length - 1 || 1)) * 600;
                const yPos = 170 - (cumInterest / maxVal) * 150;
                return `${x},${yPos}`;
              });

              return (
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  points={`0,170 ${points.join(' ')}`}
                />
              );
            })()}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2">
            <span>Year 1</span>
            <span>Year {Math.round(params.tenorYears * 0.25)}</span>
            <span>Year {Math.round(params.tenorYears * 0.5)}</span>
            <span>Year {Math.round(params.tenorYears * 0.75)}</span>
            <span>Year {params.tenorYears} (Payoff)</span>
          </div>
        </div>
      </div>

      {/* Schedule Table: Yearly or Monthly */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {viewMode === 'yearly'
                ? `Year-by-Year Amortization (${withPrepay.yearlySummary.length} Years)`
                : `Monthly Installment Log (${withPrepay.monthlySchedule.length} Months)`}
            </h3>
            <p className="text-xs text-slate-500">
              Figures calculated with standard Singapore Actual/365 monthly amortization
            </p>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Total Interest: <strong>{formatSGD(withPrepay.totalInterestPaid)}</strong>
          </div>
        </div>

        {viewMode === 'yearly' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Beginning Balance</th>
                  <th className="py-3 px-4 text-right">Total Payments</th>
                  <th className="py-3 px-4 text-right text-blue-700">Principal Paid</th>
                  <th className="py-3 px-4 text-right text-amber-700">Interest Paid</th>
                  <th className="py-3 px-4 text-right">Ending Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {withPrepay.yearlySummary.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-900">
                      Year {row.year}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700 tabular-nums">
                      {formatSGD(row.beginningBalance)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-slate-900 tabular-nums">
                      {formatSGD(row.totalPayment)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-blue-700 font-semibold tabular-nums">
                      {formatSGD(row.principalPaid)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-amber-600 font-medium tabular-nums">
                      {formatSGD(row.interestPaid)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                      {formatSGD(row.endingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Start Balance</th>
                  <th className="py-3 px-4 text-right">Installment</th>
                  <th className="py-3 px-4 text-right text-blue-700">Principal</th>
                  <th className="py-3 px-4 text-right text-amber-700">Interest</th>
                  <th className="py-3 px-4 text-right">End Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {withPrepay.monthlySchedule.slice(0, monthlyLimit).map((row) => (
                  <tr key={row.monthIndex} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-4 text-slate-500 font-semibold">
                      #{row.monthIndex}
                    </td>
                    <td className="py-2 px-4 font-sans text-slate-800 font-medium">
                      {row.dateStr}
                    </td>
                    <td className="py-2 px-4 text-right text-slate-600 tabular-nums">
                      {formatSGD(row.beginningBalance)}
                    </td>
                    <td className="py-2 px-4 text-right font-medium text-slate-900 tabular-nums">
                      {formatSGD(row.monthlyPayment)}
                    </td>
                    <td className="py-2 px-4 text-right text-blue-700 font-semibold tabular-nums">
                      {formatSGD(row.principalPaid)}
                    </td>
                    <td className="py-2 px-4 text-right text-amber-600 tabular-nums">
                      {formatSGD(row.interestPaid)}
                    </td>
                    <td className="py-2 px-4 text-right font-bold text-slate-900 tabular-nums">
                      {formatSGD(row.endingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {monthlyLimit < withPrepay.monthlySchedule.length && (
              <div className="p-3 text-center bg-slate-50 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setMonthlyLimit((prev) => prev + 60)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Load Next 60 Months ({monthlyLimit} of {withPrepay.monthlySchedule.length} shown)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
