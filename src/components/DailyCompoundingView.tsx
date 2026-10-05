import React, { useState } from 'react';
import { Calculator, ArrowRight, TrendingUp, Sliders, ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';
import { SoraDailyRecord } from '../types/sora';
import { calculateCompoundedSora, formatPercent, formatSGD, formatSoraRate } from '../utils/soraMath';

interface DailyCompoundingViewProps {
  records: SoraDailyRecord[];
  principalAmount: number;
  bankSpread: number;
}

export const DailyCompoundingView: React.FC<DailyCompoundingViewProps> = ({
  records,
  principalAmount,
  bankSpread,
}) => {
  // Allow user to simulate rate shifts on daily overnight rates
  const [rateShift, setRateShift] = useState<number>(0);

  // Apply rate shift if any
  const simulatedRecords = records.map((r) => ({
    ...r,
    overnightRate: Math.max(0.01, Number((r.overnightRate + rateShift).toFixed(4))),
  }));

  const { compoundedRate, totalCalendarDays, steps } = calculateCompoundedSora(
    simulatedRecords,
    principalAmount
  );

  const effectiveAllInRate = Number((compoundedRate + bankSpread).toFixed(4));
  const totalInterestForPeriod = steps.reduce((sum, s) => sum + s.dailyInterestAccrual, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Daily In-Arrears Compounding Simulator
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Inspect the exact mathematical daily compounding mechanism mandated by the Monetary Authority of Singapore (MAS) and the Steering Committee for SOR & SIBOR Transition to SORA (SC-STS).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Actual/365 Convention</span>
          <span aria-hidden="true">·</span>
          <span>Weekend Multi-Day Weighting ($n_i$)</span>
        </div>
      </div>

      {/* Official MAS Formula Display Box */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Official MAS Compounding Formula
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">SC-STS Standard</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-center overflow-x-auto text-xs sm:text-sm py-5 space-y-1">
          <div className="text-blue-300 font-semibold tracking-wide">
            Compounded SORA = [ &prod;<sub>i=1</sub><sup>d<sub>0</sub></sup> ( 1 + (SORA<sub>i</sub> &times; n<sub>i</sub> / 365) ) &minus; 1 ] &times; ( 365 / d ) &times; 100%
          </div>
          <p className="text-[11px] text-slate-400 font-sans mt-2">
            where <strong>d<sub>0</sub></strong> = Singapore business days, <strong>SORA<sub>i</sub></strong> = published overnight rate, <strong>n<sub>i</sub></strong> = calendar days rate applies (Fri=3 days), <strong>d</strong> = total period calendar days.
          </p>
        </div>

        {/* Dynamic Calculation Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block">Compounded Benchmark Rate:</span>
            <span className="text-lg font-bold font-mono text-blue-600 tabular-nums">
              {formatSoraRate(compoundedRate)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block">Bank Margin (+Spread):</span>
            <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              +{formatPercent(bankSpread)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-xs text-slate-500 block">All-in Effective Rate:</span>
            <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {formatPercent(effectiveAllInRate)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200">
            <span className="text-xs text-blue-700 block">Interest Accrued on S$ {(principalAmount / 1000).toFixed(0)}k:</span>
            <span className="text-lg font-bold font-mono text-blue-950 tabular-nums">
              {formatSGD(totalInterestForPeriod)}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Rate Shock Simulation Slider */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-600" />
            <label htmlFor="rate-shift-slider" className="text-sm font-semibold text-slate-900">
              Interactive Stress Simulation: Overnight Rate Shock
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-800">
              {rateShift > 0 ? `+${rateShift.toFixed(2)}%` : `${rateShift.toFixed(2)}%`}
            </span>
            {rateShift !== 0 && (
              <button
                type="button"
                onClick={() => setRateShift(0)}
                className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <input
          id="rate-shift-slider"
          type="range"
          min="-1.50"
          max="2.00"
          step="0.05"
          value={rateShift}
          onChange={(e) => setRateShift(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
          <span>-1.50% (Rate Cut)</span>
          <span>-0.50%</span>
          <span>Baseline (0.00%)</span>
          <span>+0.50%</span>
          <span>+2.00% (Inflation Hike)</span>
        </div>
      </div>

      {/* Step-by-Step Daily Rate Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Daily Accrual Log ({totalCalendarDays} Total Calendar Days)
            </h3>
            <p className="text-xs text-slate-500">
              Detailed audit trail of published MAS overnight rates and cumulative compounding factors
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Principal Base: {formatSGD(principalAmount)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="py-3 px-4">Publication Date</th>
                <th className="py-3 px-4">Day of Week</th>
                <th className="py-3 px-4 text-right">MAS Overnight Rate</th>
                <th className="py-3 px-4 text-center">Weight (n<sub>i</sub>)</th>
                <th className="py-3 px-4 text-right">Daily Accrual Factor</th>
                <th className="py-3 px-4 text-right">Cumulative Product (&prod;)</th>
                <th className="py-3 px-4 text-right">Daily SGD Interest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {steps.map((step, idx) => {
                const isWeekendCarry = step.calendarDaysWeight > 1;
                return (
                  <tr
                    key={step.date}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isWeekendCarry ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-sans text-slate-900 font-medium">
                      {step.date}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-slate-600">
                      {step.dayOfWeek}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-900 font-semibold tabular-nums">
                      {formatSoraRate(step.overnightRate)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          isWeekendCarry
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                        title={
                          isWeekendCarry
                            ? 'Carries over Friday, Saturday, and Sunday (3 calendar days)'
                            : '1 calendar business day'
                        }
                      >
                        {step.calendarDaysWeight} {step.calendarDaysWeight > 1 ? 'days' : 'day'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-600 tabular-nums">
                      {step.dailyFactor.toFixed(8)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-blue-600 font-bold tabular-nums">
                      {step.cumulativeProduct.toFixed(8)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-900 font-semibold tabular-nums">
                      {formatSGD(step.dailyInterestAccrual)}
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
