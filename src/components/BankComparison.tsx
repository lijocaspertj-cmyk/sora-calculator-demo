import React from 'react';
import { Check, ArrowRight, Shield, Award, HelpCircle } from 'lucide-react';
import { SINGAPORE_BANK_PRESETS } from '../data/masBaselineRates';
import { BankPackagePreset, LoanParams, SoraDailyRecord } from '../types/sora';
import { calculateMonthlyRepayment, formatPercent, formatSGD, formatSoraRate } from '../utils/soraMath';

interface BankComparisonProps {
  params: LoanParams;
  latestRecord?: SoraDailyRecord;
  onApplyPackage: (pkg: BankPackagePreset) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const BankComparison: React.FC<BankComparisonProps> = ({
  params,
  latestRecord,
  onApplyPackage,
  onNavigateToTab,
}) => {
  const getPackageBenchmarkRate = (pkg: BankPackagePreset): number => {
    if (pkg.fixedRatePromo) return pkg.fixedRatePromo;
    if (!latestRecord) return 3.05;

    switch (pkg.benchmarkType) {
      case '1M':
        return latestRecord.compSora1M;
      case '3M':
        return latestRecord.compSora3M;
      case '6M':
        return latestRecord.compSora6M;
      default:
        return latestRecord.compSora3M;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Singapore Bank SORA Packages Comparison
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Compare live floating packages from major Singapore banks (DBS, OCBC, UOB, StanChart) against promotional fixed rate packages for a principal of {formatSGD(params.principal)}.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Principal: {formatSGD(params.principal, true)} · {params.tenorYears} Yrs Tenor
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SINGAPORE_BANK_PRESETS.map((pkg) => {
          const benchmarkRate = getPackageBenchmarkRate(pkg);
          const isFixed = Boolean(pkg.fixedRatePromo);
          const allInYear1Rate = isFixed
            ? pkg.fixedRatePromo!
            : benchmarkRate + pkg.spreadYear1to3;

          const monthlyPayment = calculateMonthlyRepayment(
            params.principal,
            allInYear1Rate,
            params.tenorYears
          );

          // 3-year interest estimate
          const threeYearPayment = monthlyPayment * 36;
          const approxPrincipalPaid3Yr = params.principal * 0.06; // approximation for 25-30 yr
          const approxInterestPaid3Yr = Math.max(0, threeYearPayment - approxPrincipalPaid3Yr);

          return (
            <div
              key={pkg.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow relative"
            >
              <div className="space-y-4">
                {/* Bank Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      {pkg.bankName}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {pkg.packageName}
                    </h3>
                  </div>
                  {isFixed ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      Fixed Promo
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {pkg.benchmarkType} SORA Pegged
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed min-h-[32px]">
                  {pkg.recommendedFor}
                </p>

                {/* Key Numbers */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-600">Initial Installment:</span>
                    <span className="font-mono text-xl font-extrabold text-slate-900 tabular-nums">
                      {formatSGD(monthlyPayment)}
                      <span className="text-xs font-normal text-slate-500">/mo</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-600">Effective Rate (Y1-3):</span>
                    <strong className="font-mono text-slate-900 tabular-nums">
                      {formatPercent(allInYear1Rate)} p.a.
                    </strong>
                  </div>
                </div>

                {/* Rate Structure Breakdown */}
                <div className="space-y-2 text-xs text-slate-600 pt-1">
                  <div className="flex justify-between">
                    <span>Benchmark:</span>
                    <strong className="font-mono text-slate-800">
                      {isFixed
                        ? `Fixed ${pkg.fixedRatePromo}%`
                        : `${pkg.benchmarkType} SORA (${formatSoraRate(benchmarkRate)})`}
                    </strong>
                  </div>

                  {!isFixed && (
                    <>
                      <div className="flex justify-between">
                        <span>Margin (Years 1 - 3):</span>
                        <strong className="font-mono text-slate-800">
                          +{formatPercent(pkg.spreadYear1to3)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Margin (Year 4 onwards):</span>
                        <strong className="font-mono text-slate-800">
                          +{formatPercent(pkg.spreadThereafter)}
                        </strong>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between">
                    <span>Lock-in Commitment:</span>
                    <span className="font-medium text-slate-800">{pkg.lockInPeriodYears} Years</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Minimum Loan:</span>
                    <span className="font-mono text-slate-800">{formatSGD(pkg.minLoanAmount, true)}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onApplyPackage(pkg);
                    onNavigateToTab('calculator');
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Select & Calculate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide: Floating SORA vs Fixed in Singapore */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Floating SORA vs Fixed Rate Home Loans: How to Decide in Singapore
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900">Floating SORA Packages (1M vs 3M SORA)</h4>
            <p>
              Floating loans directly reflect daily interbank Singapore market conditions. When global and MAS policy rates decline, SORA loans automatically adjust downward at every reset interval without refinancing fees.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li><strong>1M SORA</strong>: Reacts rapidly every 30 days to downward rate adjustments.</li>
              <li><strong>3M SORA</strong>: Balances rate responsiveness with 90-day cashflow predictability.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900">Fixed Rate Packages</h4>
            <p>
              Fixed rate loans lock your interest rate for 2 to 3 years. They provide absolute budget security against rate hikes. After the lock-in period concludes, they transition back into a floating SORA-pegged rate (e.g., 3M SORA + 0.85%).
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li>Peace of mind with invariant monthly instalments during the lock-in.</li>
              <li>Slight premium over current floating rates to pay for the hedge.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
