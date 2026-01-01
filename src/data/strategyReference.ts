// Strategy Reference Data - The Eiduk System™ 70-Strategy Framework

export interface Strategy {
  number: number;
  phase: number;
  name: string;
  irc: string;
  docs: string[];
  warning?: string;
}

export interface Phase {
  number: number;
  name: string;
  color: string;
  strategies: [number, number]; // [start, end] strategy numbers
  target: string;
}

export interface ServiceTier {
  name: string;
  phases: number[];
  strategies: number;
}

export const STRATEGIES: Record<number, Strategy> = {
  // Phase 1: Foundation (#1-6)
  1: { number: 1, phase: 1, name: "Reasonable Compensation", irc: "§3121(a), Rev Rul 74-44", docs: ["Salary analysis", "Industry comparables", "Time allocation"] },
  2: { number: 2, phase: 1, name: "S-Corp Health Insurance", irc: "§162(l)", docs: ["W-2 Box 1 inclusion", "Policy documentation", "MEC verification"] },
  3: { number: 3, phase: 1, name: "Accountable Plan", irc: "§62(a)(2)(A), Reg 1.62-2", docs: ["Written policy adopted", "Expense reports filed", "60-day substantiation"] },
  4: { number: 4, phase: 1, name: "Augusta Rule", irc: "§280A(g)", docs: ["Rental agreement", "FMV documentation", "Meeting minutes"] },
  5: { number: 5, phase: 1, name: "Asset Reimbursement", irc: "§162, §274", docs: ["Asset list & FMV", "Business use %", "Reimbursement log"] },
  6: { number: 6, phase: 1, name: "Hiring Kids", irc: "§73, §3121(b)(3)(A)", docs: ["Job description", "Time records", "W-2 issued"] },
  
  // Phase 2: Core Deductions (#7-13)
  7: { number: 7, phase: 2, name: "Section 179 Election", irc: "§179", docs: ["Asset list", "Placed in service date", "Form 4562"] },
  8: { number: 8, phase: 2, name: "Bonus Depreciation", irc: "§168(k)", docs: ["Asset classification", "Recovery periods", "Election statement"] },
  9: { number: 9, phase: 2, name: "Home Office Deduction", irc: "§280A(c)", docs: ["Square footage calc", "Expense allocation", "Regular/exclusive use"] },
  10: { number: 10, phase: 2, name: "Vehicle Strategy", irc: "§162, §274", docs: ["Mileage log", "Business use %", "Method election"] },
  11: { number: 11, phase: 2, name: "QBI Optimization", irc: "§199A", docs: ["QBI calculation", "W-2 wage analysis", "SSTB determination"] },
  12: { number: 12, phase: 2, name: "Timing Strategies", irc: "§461, §451", docs: ["Income deferral plan", "Expense acceleration", "Year-end review"] },
  13: { number: 13, phase: 2, name: "Inventory Method Optimization", irc: "§263A, §472", docs: ["Method analysis", "Form 3115 if changing", "UNICAP review"] },
  
  // Phase 3: Retirement & Benefits (#14-23)
  14: { number: 14, phase: 3, name: "Solo 401(k)", irc: "§401(k), §402(g)", docs: ["Plan document", "Contribution calc", "Form 5500-EZ if >$250k"] },
  15: { number: 15, phase: 3, name: "Profit Sharing 401(k)", irc: "§401(a)(3)", docs: ["Allocation method", "Contribution deadline", "Discrimination testing"] },
  16: { number: 16, phase: 3, name: "Cash Balance Plan", irc: "§401(a), §415", docs: ["Actuarial study", "Plan document", "Annual funding"] },
  17: { number: 17, phase: 3, name: "Mega Backdoor Roth", irc: "§402(c), §401(k)", docs: ["Plan allows after-tax", "Conversion executed", "Form 1099-R"] },
  18: { number: 18, phase: 3, name: "HSA Triple Tax", irc: "§223", docs: ["HDHP enrollment", "Contribution max", "Investment allocation"] },
  19: { number: 19, phase: 3, name: "Backdoor Roth IRA", irc: "§408A, §408(d)(2)", docs: ["Non-deductible contrib", "Conversion completed", "Form 8606"] },
  20: { number: 20, phase: 3, name: "Roth Conversions", irc: "§408A(d)(3)", docs: ["Bracket analysis", "Conversion amount", "5-year tracking"] },
  21: { number: 21, phase: 3, name: "Self-Directed Accounts", irc: "§408, §4975", docs: ["Custodian established", "Investment docs", "UBIT analysis"] },
  22: { number: 22, phase: 3, name: "QSEHRA/HRA", irc: "§9831(d), §105", docs: ["Plan document", "Employee notice", "Reimbursement records"] },
  23: { number: 23, phase: 3, name: "Section 412(e)(3) DB Plan", irc: "§412(e)(3)", docs: ["Insurance contracts", "Annual premium", "Form 5500"] },
  
  // Phase 4: Credits & Multistate (#24-30)
  24: { number: 24, phase: 4, name: "R&D Tax Credit", irc: "§41", docs: ["4-part test analysis", "QRE documentation", "Form 6765"] },
  25: { number: 25, phase: 4, name: "WOTC", irc: "§51", docs: ["Form 8850 filed", "Certification received", "Form 5884"] },
  26: { number: 26, phase: 4, name: "PTET Election", irc: "State-specific", docs: ["Election filed", "Payments made", "K-1 adjustments"] },
  27: { number: 27, phase: 4, name: "State Tax Planning", irc: "Various", docs: ["Nexus analysis", "Apportionment calc", "State credits identified"] },
  28: { number: 28, phase: 4, name: "Energy Credits", irc: "§30D, §45L, §179D", docs: ["Qualifying property", "Credit calculation", "Certification"] },
  29: { number: 29, phase: 4, name: "IC-DISC", irc: "§991-997", docs: ["DISC incorporated", "Commission calc", "Dividend planning"] },
  30: { number: 30, phase: 4, name: "Historic Rehabilitation Credits", irc: "§47", docs: ["NPS certification", "QRE documentation", "Form 3468"] },
  
  // Phase 5: Real Estate & PAL (#31-38)
  31: { number: 31, phase: 5, name: "RE Professional Status", irc: "§469(c)(7)", docs: ["750+ hours documented", "Material participation", "Time log"] },
  32: { number: 32, phase: 5, name: "Cost Segregation Study", irc: "§168, Rev Proc 87-56", docs: ["Engineering study", "Asset reclassification", "Form 3115 if needed"] },
  33: { number: 33, phase: 5, name: "STR Loophole", irc: "§469, Reg 1.469-1T(e)(3)", docs: ["<7 day avg stay", "Material participation", "Booking records"] },
  34: { number: 34, phase: 5, name: "Self-Rental Loophole", irc: "Reg 1.469-2(f)(6)", docs: ["Lease agreement", "FMV rent", "Entity structure"] },
  35: { number: 35, phase: 5, name: "1031 Exchange", irc: "§1031", docs: ["QI engaged", "45-day ID", "180-day close"] },
  36: { number: 36, phase: 5, name: "PAL Grouping Election", irc: "§469, Reg 1.469-4", docs: ["Grouping statement", "Activity analysis", "Election filed"] },
  37: { number: 37, phase: 5, name: "Syndication Loophole", irc: "§469(c)(7)(B)", docs: ["RE Pro status", "K-1 treatment", "Loss utilization"] },
  38: { number: 38, phase: 5, name: "PIGs vs PALs Matching", irc: "§469(d), Reg 1.469-2", docs: ["PAL carryforward", "PIG investments", "Matching analysis"] },
  
  // Phase 6: Acquisitions & Leverage (#39-49)
  39: { number: 39, phase: 6, name: "Heavy Vehicle Strategy", irc: "§179, §168(k)", docs: ["GVWR verification", "Business use log", "Form 4562"] },
  40: { number: 40, phase: 6, name: "Oil & Gas Investments", irc: "§263(c), §613A", docs: ["IDC deductions", "Depletion calc", "K-1 received"] },
  41: { number: 41, phase: 6, name: "DST Investments", irc: "§1031, Rev Rul 2004-86", docs: ["PPM reviewed", "1031 exchange docs", "K-1 received"] },
  42: { number: 42, phase: 6, name: "Opportunity Zone", irc: "§1400Z-2", docs: ["QOF investment", "180-day deadline", "Form 8997"] },
  43: { number: 43, phase: 6, name: "Equipment Acquisition", irc: "§179, §168(k), §465, §469", docs: ["Equipment FMV", "At-risk analysis", "Form 4562"] },
  44: { number: 44, phase: 6, name: "Captive Insurance ⚠️", irc: "§831(b), §162", docs: ["Actuarial study", "Risk distribution", "Form 8886 disclosure"], warning: "Listed Transaction - Notice 2016-66" },
  45: { number: 45, phase: 6, name: "Financed Business Insurance", irc: "§264, §163", docs: ["Business purpose", "Premium financing", "Interest deduction"] },
  46: { number: 46, phase: 6, name: "Leveraged Technology Purchase", irc: "§163, §179, §168(k)", docs: ["Software qualification", "Financing terms", "§163(j) analysis"] },
  47: { number: 47, phase: 6, name: "Film & Media Investment", irc: "§181, §167(g), §465, §469", docs: ["§181 election", "At-risk qualification", "Material participation"] },
  48: { number: 48, phase: 6, name: "Software RTU Investment ⚠️", irc: "§179, §168(k), §469, §465", docs: ["Independent opinion", "Participation tracking", "Form 8275"], warning: "Elevated IRS scrutiny" },
  49: { number: 49, phase: 6, name: "Leveraged Trading Partnership", irc: "§704(b), §465, §469", docs: ["Lender independence", "DRO analysis", "Form 8275"] },
  
  // Phase 7: Exit & Wealth Transfer (#50-59)
  50: { number: 50, phase: 7, name: "QSBS Exclusion", irc: "§1202", docs: ["C-Corp original issuance", "Gross assets ≤$50M", "5+ year holding"] },
  51: { number: 51, phase: 7, name: "Installment Sale", irc: "§453", docs: ["Installment terms", "AFR interest", "Gain schedule"] },
  52: { number: 52, phase: 7, name: "ESOP Exit", irc: "§1042", docs: ["Feasibility study", "Valuation", "30%+ sale to ESOP"] },
  53: { number: 53, phase: 7, name: "CRT Strategy", irc: "§664", docs: ["Trust document", "Actuarial calc", "Deduction amount"] },
  54: { number: 54, phase: 7, name: "Family LP/LLC", irc: "§2704, Rev Rul 93-12", docs: ["Operating agreement", "Discount study", "Gift tax returns"] },
  55: { number: 55, phase: 7, name: "Stepped-Up Basis", irc: "§1014", docs: ["Asset analysis", "Estate plan coordination", "Basis documentation"] },
  56: { number: 56, phase: 7, name: "Dynasty Trust", irc: "§2601", docs: ["Trust document", "GST exemption", "Trustee succession"] },
  57: { number: 57, phase: 7, name: "Deferred Sales Trust", irc: "§453, §1001", docs: ["Independent trustee", "Installment note", "Economic substance"] },
  58: { number: 58, phase: 7, name: "Buy-Sell Agreement Planning", irc: "§2703, §302", docs: ["Agreement drafted", "Valuation method", "Insurance funding"] },
  59: { number: 59, phase: 7, name: "Stock Redemption", irc: "§302, §318", docs: ["§302(b) test", "Attribution rules", "Capital vs dividend"] },
  
  // Phase 8: Charitable & Philanthropic (#60-70)
  60: { number: 60, phase: 8, name: "Donor Advised Fund", irc: "§170(f)(18)", docs: ["DAF established", "Contribution substantiation", "Bunching planned"] },
  61: { number: 61, phase: 8, name: "Private Foundation", irc: "§501(c)(3), §4940-4945", docs: ["Form 1023 filed", "Self-dealing reviewed", "5% distribution met"] },
  62: { number: 62, phase: 8, name: "Supporting Organization", irc: "§509(a)(3)", docs: ["Type classification", "Supported org relationship", "Responsiveness test"] },
  63: { number: 63, phase: 8, name: "CLAT", irc: "§170(f)(2)(B), §2055", docs: ["Trust document", "Annuity calculated", "Remainder analysis"] },
  64: { number: 64, phase: 8, name: "CLUT", irc: "§170(f)(2)(B)", docs: ["Trust document", "Unitrust % calculated", "Annual revaluation"] },
  65: { number: 65, phase: 8, name: "Charitable Pooled Income Fund", irc: "§642(c)(5)", docs: ["Fund selected", "Income interest", "Remainder deduction"] },
  66: { number: 66, phase: 8, name: "Charitable LLC/Holding Company", irc: "§170, §721", docs: ["LLC formation", "Interest donation", "Pre-sale valuation"] },
  67: { number: 67, phase: 8, name: "Qualified Charitable Distribution", irc: "§408(d)(8)", docs: ["Age 70.5+ verified", "Direct IRA transfer", "Charity acknowledgment"] },
  68: { number: 68, phase: 8, name: "Charitable Bargain Sale", irc: "§1011(b)", docs: ["FMV appraisal", "Basis allocation", "Sale/gift ratio"] },
  69: { number: 69, phase: 8, name: "Conservation Easement ⚠️", irc: "§170(h)", docs: ["Conservation purpose", "Form 8283 appraisal", "Perpetual restriction"], warning: "Listed Transaction - Notice 2017-10 for syndicated" },
  70: { number: 70, phase: 8, name: "Leveraged Charitable Giving", irc: "§170, §163(d)", docs: ["Assets unencumbered", "Borrowing facility", "§163(d) limitation"] }
};

export const PHASES: Record<number, Phase> = {
  1: { number: 1, name: "Foundation", color: "bg-phase-foundation", strategies: [1, 6], target: "$8k-$20k" },
  2: { number: 2, name: "Core Deductions", color: "bg-phase-deductions", strategies: [7, 13], target: "$5k-$25k" },
  3: { number: 3, name: "Retirement & Benefits", color: "bg-phase-retirement", strategies: [14, 23], target: "$10k-$150k+" },
  4: { number: 4, name: "Credits & Multistate", color: "bg-phase-credits", strategies: [24, 30], target: "$8k-$50k" },
  5: { number: 5, name: "Real Estate & PAL", color: "bg-phase-realestate", strategies: [31, 38], target: "$30k-$150k+" },
  6: { number: 6, name: "Acquisitions & Leverage", color: "bg-phase-acquisitions", strategies: [39, 49], target: "$50k-$350k+" },
  7: { number: 7, name: "Exit & Wealth Transfer", color: "bg-phase-exit", strategies: [50, 59], target: "$50k-$500k+" },
  8: { number: 8, name: "Charitable & Philanthropic", color: "bg-phase-charitable", strategies: [60, 70], target: "$55k-$350k+" }
};

export const SERVICE_TIERS: Record<string, ServiceTier> = {
  essentials: { name: "Essentials", phases: [], strategies: 0 },
  foundation: { name: "Foundation", phases: [1, 2], strategies: 13 },
  complete: { name: "Complete", phases: [1, 2, 3, 4], strategies: 30 },
  premium: { name: "Premium", phases: [1, 2, 3, 4, 5, 6, 7, 8], strategies: 70 }
};

// Helper to get strategies for a phase
export const getStrategiesForPhase = (phaseNumber: number): Strategy[] => {
  const phase = PHASES[phaseNumber];
  if (!phase) return [];
  const strategies: Strategy[] = [];
  for (let i = phase.strategies[0]; i <= phase.strategies[1]; i++) {
    if (STRATEGIES[i]) strategies.push(STRATEGIES[i]);
  }
  return strategies;
};

// Get all phases as array
export const getPhasesArray = (): Phase[] => {
  return Object.values(PHASES).sort((a, b) => a.number - b.number);
};

// Total strategy count
export const TOTAL_STRATEGIES = 70;
