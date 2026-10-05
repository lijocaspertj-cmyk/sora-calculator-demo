export interface SoraDailyRecord {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  overnightRate: number; // e.g., 3.0520%
  soraIndex: number; // e.g., 114.281
  compSora1M: number; // e.g., 3.0410%
  compSora3M: number; // e.g., 3.0850%
  compSora6M: number; // e.g., 3.1200%
  aggregateVolumeMillion: number; // in SGD Millions (e.g., 3850)
  percentile25?: number;
  percentile75?: number;
  isWeekendOrHoliday?: boolean;
  daysWeight: number; // 1 for Mon-Thu, 3 for Fri, or holiday count
}

export type SoraBenchmarkType = '1M' | '3M' | '6M' | 'daily' | 'custom';

export interface LoanParams {
  principal: number; // SGD
  tenorYears: number; // e.g., 25
  benchmarkType: SoraBenchmarkType;
  customSoraRate: number;
  bankSpread: number; // e.g., 0.70 (%)
  applyStressTest: boolean;
  stressTestFloor: number; // default 4.0% MAS guideline
}

export interface AmortizationMonth {
  monthIndex: number;
  yearIndex: number;
  dateStr: string;
  beginningBalance: number;
  monthlyPayment: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface CompoundingStepDetail {
  date: string;
  dayOfWeek: string;
  overnightRate: number;
  calendarDaysWeight: number;
  dailyFactor: number;
  cumulativeProduct: number;
  dailyInterestAccrual: number;
}

export interface BankPackagePreset {
  id: string;
  bankName: string;
  packageName: string;
  benchmarkType: SoraBenchmarkType;
  spreadYear1to3: number;
  spreadThereafter: number;
  fixedRatePromo?: number;
  lockInPeriodYears: number;
  minLoanAmount: number;
  recommendedFor: string;
}

export interface BackendIntegrationConfig {
  mode: 'offline-mas-baseline' | 'custom-backend';
  customUrl: string;
  apiKey: string;
  status: 'synced' | 'connecting' | 'fallback' | 'error';
  lastSyncedAt?: string;
  errorMessage?: string;
}
