import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { BackendIntegrationConfig, SoraDailyRecord } from '../types/sora';
import { formatSGD, formatSoraRate } from '../utils/soraMath';

interface RateTickerBarProps {
  latestRecord?: SoraDailyRecord;
  backendConfig: BackendIntegrationConfig;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const RateTickerBar: React.FC<RateTickerBarProps> = ({
  latestRecord,
  backendConfig,
  isRefreshing,
  onRefresh,
}) => {
  if (!latestRecord) return null;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Source metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              MAS Official Benchmark
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Date: <strong className="text-slate-700">{latestRecord.date}</strong></span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="hidden sm:inline">Volume: <strong className="text-slate-700">S$ {(latestRecord.aggregateVolumeMillion / 1000).toFixed(2)}B</strong></span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="hidden md:inline">Index: <strong className="text-slate-700 font-mono">{latestRecord.soraIndex.toFixed(3)}</strong></span>
          </div>

          {/* Right: Key Rate Cards */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Overnight SORA:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {formatSoraRate(latestRecord.overnightRate)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50/70 border border-blue-200/80">
              <span className="text-blue-700 font-medium">1M SORA:</span>
              <span className="font-mono font-bold text-blue-900 tabular-nums">
                {formatSoraRate(latestRecord.compSora1M)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200">
              <span className="text-indigo-700 font-semibold">3M SORA:</span>
              <span className="font-mono font-bold text-indigo-950 tabular-nums">
                {formatSoraRate(latestRecord.compSora3M)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200">
              <span className="text-slate-500">6M SORA:</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {formatSoraRate(latestRecord.compSora6M)}
              </span>
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh MAS benchmark rates"
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
