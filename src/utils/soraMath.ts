import { AmortizationMonth, CompoundingStepDetail, LoanParams, SoraDailyRecord } from '../types/sora';

/**
 * Calculates compounded SORA according to the official MAS Actual/365 convention:
 * Compounded SORA = [ Product(1 + (SORA_i * n_i / 365)) - 1 ] * (365 / d) * 100
 */
export function calculateCompoundedSora(records: SoraDailyRecord[], principalAmount: number = 500000): {
  compoundedRate: number;
  totalCalendarDays: number;
  steps: CompoundingStepDetail[];
} {
  if (!records || records.length === 0) {
    return { compoundedRate: 0, totalCalendarDays: 0, steps: [] };
  }

  let cumulativeProduct = 1.0;
  let totalCalendarDays = 0;
  const steps: CompoundingStepDetail[] = [];

  for (const record of records) {
    const soraRatePercent = record.overnightRate; // in percent, e.g. 3.0150
    const soraDecimal = soraRatePercent / 100;
    const n_i = record.daysWeight || 1;
    totalCalendarDays += n_i;

    const dailyFactor = 1 + (soraDecimal * n_i) / 365;
    cumulativeProduct *= dailyFactor;

    // Daily interest accrued on principal for this specific interval
    const dailyInterestAccrual = (principalAmount * soraDecimal * n_i) / 365;

    steps.push({
      date: record.date,
      dayOfWeek: record.dayOfWeek,
      overnightRate: soraRatePercent,
      calendarDaysWeight: n_i,
      dailyFactor,
      cumulativeProduct,
      dailyInterestAccrual,
    });
  }

  const compoundedRate = ((cumulativeProduct - 1) * (365 / totalCalendarDays)) * 100;

  return {
    compoundedRate: Number(compoundedRate.toFixed(4)),
    totalCalendarDays,
    steps,
  };
}

/**
 * Calculates Equated Monthly Installment (EMI) using standard financial amortization.
 * M = P * [ r*(1+r)^n ] / [ (1+r)^n - 1 ]
 */
export function calculateMonthlyRepayment(principal: number, annualRatePercent: number, tenorYears: number): number {
  if (principal <= 0 || tenorYears <= 0) return 0;
  if (annualRatePercent <= 0) return principal / (tenorYears * 12);

  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = tenorYears * 12;

  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);

  return Number(monthlyPayment.toFixed(2));
}

/**
 * Generates the full amortization schedule month by month, with support for lump-sum prepayments.
 */
export function generateAmortizationSchedule(
  params: LoanParams,
  effectiveRatePercent: number,
  prepayments: { month: number; amount: number }[] = []
): {
  monthlySchedule: AmortizationMonth[];
  yearlySummary: {
    year: number;
    beginningBalance: number;
    totalPayment: number;
    principalPaid: number;
    interestPaid: number;
    endingBalance: number;
  }[];
  totalInterestPaid: number;
  totalRepayment: number;
  actualMonthsToPayoff: number;
} {
  const { principal, tenorYears } = params;
  const totalPlannedMonths = tenorYears * 12;
  const monthlyRate = effectiveRatePercent / 100 / 12;
  const standardMonthlyPayment = calculateMonthlyRepayment(principal, effectiveRatePercent, tenorYears);

  let currentBalance = principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  const monthlySchedule: AmortizationMonth[] = [];

  const prepaymentMap = new Map<number, number>();
  for (const p of prepayments) {
    prepaymentMap.set(p.month, (prepaymentMap.get(p.month) || 0) + p.amount);
  }

  const startDate = new Date();

  for (let m = 1; m <= totalPlannedMonths && currentBalance > 0.01; m++) {
    const yearIndex = Math.ceil(m / 12);
    const beginningBalance = currentBalance;
    const interestForMonth = beginningBalance * monthlyRate;

    const extraPrepayment = prepaymentMap.get(m) || 0;
    let payment = standardMonthlyPayment;

    // Handle final fractional month payoff
    if (beginningBalance + interestForMonth < payment + extraPrepayment) {
      payment = beginningBalance + interestForMonth;
    }

    const principalPaidFromInstallment = Math.min(beginningBalance, Math.max(0, payment - interestForMonth));
    const totalPrincipalThisMonth = Math.min(beginningBalance, principalPaidFromInstallment + extraPrepayment);
    const endingBalance = Math.max(0, beginningBalance - totalPrincipalThisMonth);

    cumulativeInterest += interestForMonth;
    cumulativePrincipal += totalPrincipalThisMonth;
    currentBalance = endingBalance;

    const rowDate = new Date(startDate.getFullYear(), startDate.getMonth() + m - 1, 1);
    const dateStr = rowDate.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });

    monthlySchedule.push({
      monthIndex: m,
      yearIndex,
      dateStr,
      beginningBalance: Number(beginningBalance.toFixed(2)),
      monthlyPayment: Number((payment + extraPrepayment).toFixed(2)),
      principalPaid: Number(totalPrincipalThisMonth.toFixed(2)),
      interestPaid: Number(interestForMonth.toFixed(2)),
      endingBalance: Number(endingBalance.toFixed(2)),
      cumulativeInterest: Number(cumulativeInterest.toFixed(2)),
      cumulativePrincipal: Number(cumulativePrincipal.toFixed(2)),
    });
  }

  // Aggregate yearly summary
  const yearlyMap = new Map<number, {
    year: number;
    beginningBalance: number;
    totalPayment: number;
    principalPaid: number;
    interestPaid: number;
    endingBalance: number;
  }>();

  for (const row of monthlySchedule) {
    const existing = yearlyMap.get(row.yearIndex);
    if (!existing) {
      yearlyMap.set(row.yearIndex, {
        year: row.yearIndex,
        beginningBalance: row.beginningBalance,
        totalPayment: row.monthlyPayment,
        principalPaid: row.principalPaid,
        interestPaid: row.interestPaid,
        endingBalance: row.endingBalance,
      });
    } else {
      existing.totalPayment += row.monthlyPayment;
      existing.principalPaid += row.principalPaid;
      existing.interestPaid += row.interestPaid;
      existing.endingBalance = row.endingBalance;
    }
  }

  const yearlySummary = Array.from(yearlyMap.values()).map((y) => ({
    ...y,
    totalPayment: Number(y.totalPayment.toFixed(2)),
    principalPaid: Number(y.principalPaid.toFixed(2)),
    interestPaid: Number(y.interestPaid.toFixed(2)),
    beginningBalance: Number(y.beginningBalance.toFixed(2)),
    endingBalance: Number(y.endingBalance.toFixed(2)),
  }));

  const totalInterestPaid = Number(cumulativeInterest.toFixed(2));
  const totalRepayment = Number((principal + totalInterestPaid).toFixed(2));

  return {
    monthlySchedule,
    yearlySummary,
    totalInterestPaid,
    totalRepayment,
    actualMonthsToPayoff: monthlySchedule.length,
  };
}

/**
 * Format currency in Singapore Dollars (SGD)
 */
export function formatSGD(amount: number, compact: boolean = false): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    return `S$ ${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(amount) >= 1_000) {
    return `S$ ${(amount / 1_000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format interest rates according to MAS standards (4 decimals for SORA benchmark, 2 decimals for spreads)
 */
export function formatSoraRate(rate: number): string {
  return `${rate.toFixed(4)}%`;
}

export function formatPercent(rate: number): string {
  return `${rate.toFixed(2)}%`;
}
