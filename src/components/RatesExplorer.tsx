import React, { useState } from 'react';
import { Search, Filter, Copy, Check, TrendingDown, TrendingUp, BarChart3, Database } from 'lucide-react';
import { SoraDailyRecord } from '../types/sora';
import { formatPercent, formatSGD, formatSoraRate } from '../utils/soraMath';

interface RatesExplorerProps {
  records: SoraDailyRecord[];
}

export const RatesExplorer: React.FC<RatesExplorerProps> = ({ records }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedDate, setCopiedDate] = useState<string | null>(null);

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    return (
      r.date.includes(searchQuery) ||
      r.dayOfWeek.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Calculate summary metrics
  const ratesList = records.map((r) => r.overnightRate);
  const avgRate = ratesList.reduce((a, b) => a + b, 0) / (ratesList.length || 1);
  const minRate = Math.min(...ratesList);
  const maxRate = Math.max(...ratesList);
  const totalVolume = records.reduce((sum, r) => sum + r.aggregateVolumeMillion, 0);

  const handleCopyRate = (record: SoraDailyRecord) => {
    navigator.clipboard.writeText(
      `MAS SORA (${record.date}): Overnight: ${formatSoraRate(record.overnightRate)}, 1M: ${formatSoraRate(record.compSora1M)}, 3M: ${formatSoraRate(record.compSora3M)}, Index: ${record.soraIndex}`
    );
    setCopiedDate(record.date);
    setTimeout(() => setCopiedDate(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            MAS SORA Historical Rates Explorer
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Official daily Singapore Overnight Rate Average historical data, compounded rates, interbank volumes, and distribution percentiles published by the Monetary Authority of Singapore.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Source: MAS E-Services Datastore</span>
          <span aria-hidden="true">·</span>
          <span>Records: {records.length} business days</span>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Average Overnight Rate:</span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            {formatSoraRate(avgRate)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Period Low Rate:</span>
          <span className="text-xl font-bold font-mono text-emerald-600 tabular-nums">
            {formatSoraRate(minRate)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Period High Rate:</span>
          <span className="text-xl font-bold font-mono text-amber-600 tabular-nums">
            {formatSoraRate(maxRate)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Interbank Volume:</span>
          <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
            S$ {(totalVolume / 1000).toFixed(1)}B
          </span>
        </div>
      </div>

      {/* Table & Search Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by date (YYYY-MM-DD) or day..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Showing {filteredRecords.length} of {records.length} published records
          </div>
        </div>

        {/* Data Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4 text-right">Overnight SORA</th>
                <th className="py-3 px-4 text-right">1M Compounded</th>
                <th className="py-3 px-4 text-right text-indigo-700">3M Compounded</th>
                <th className="py-3 px-4 text-right">6M Compounded</th>
                <th className="py-3 px-4 text-right">SORA Index</th>
                <th className="py-3 px-4 text-right">Volume (SGD)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredRecords.map((r) => {
                const isCopied = copiedDate === r.date;
                return (
                  <tr key={r.date} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                      {r.date}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">
                      {r.dayOfWeek}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                      {formatSoraRate(r.overnightRate)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700 tabular-nums">
                      {formatSoraRate(r.compSora1M)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-indigo-700 font-semibold tabular-nums">
                      {formatSoraRate(r.compSora3M)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-700 tabular-nums">
                      {formatSoraRate(r.compSora6M)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-600 tabular-nums">
                      {r.soraIndex.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-900 tabular-nums">
                      S$ {r.aggregateVolumeMillion.toLocaleString()}M
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleCopyRate(r)}
                        title="Copy rate summary"
                        className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
