-- v5.1 Strategy Updates: Heavy Vehicle moved to P2 (#10), all downstream renumbered

-- Drop FK constraint if exists
ALTER TABLE public.client_strategies DROP CONSTRAINT IF EXISTS client_strategies_strategy_id_fkey;

-- Create mapping table for old_id -> new_id transitions
CREATE TEMP TABLE id_map (old_id INTEGER, new_id INTEGER);
INSERT INTO id_map VALUES
  (1,1),(2,2),(3,3),(4,4),(5,5),(6,6),(7,7),(8,8),(9,9),
  (39,10), -- Heavy Vehicle moves from 39 to 10
  (10,11),(11,12),(12,13),(13,14), -- P2 strategies shift
  (14,15),(15,16),(16,17),(17,18),(18,19),(19,20),(20,21),(21,22),(22,23),(23,24), -- P3
  (24,25),(25,26),(26,27),(27,28),(28,29),(29,30),(30,31), -- P4
  (31,32),(32,33),(33,34),(34,35),(35,36),(36,37),(37,38),(38,39), -- P5
  (40,40),(41,41),(42,42),(43,43),(44,44),(45,45),(46,46),(47,47),(48,48), -- P6
  (49,49),(50,50),(51,51),(52,52),(53,53),(54,54),(55,55),(56,56),(57,57),(58,58),(59,59), -- P7
  (60,60),(61,61),(62,62),(63,63),(64,64),(65,65),(66,66),(67,67),(68,68),(69,69),(70,70); -- P8

-- Update client_strategies with new strategy IDs
UPDATE public.client_strategies cs
SET strategy_id = m.new_id
FROM id_map m
WHERE cs.strategy_id = m.old_id;

-- Backup all strategy data
CREATE TEMP TABLE strategy_backup AS
SELECT * FROM public.strategies;

-- Delete existing strategies
DELETE FROM public.strategies;

-- Insert strategies with phase_name (required NOT NULL column)
INSERT INTO public.strategies (id, name, phase, phase_name, what_it_is) VALUES
-- Phase 1: Foundation (1-6)
(1, 'Reasonable Compensation', 'P1', 'Foundation', 'Optimize W-2 salary vs S-Corp distributions to minimize self-employment/payroll tax while maintaining IRS-defensible compensation.'),
(2, 'S-Corp Health Insurance', 'P1', 'Foundation', '2% or greater S-Corp shareholders can deduct health insurance premiums above-the-line (not itemized).'),
(3, 'Accountable Plan', 'P1', 'Foundation', 'Formal reimbursement arrangement allowing tax-free reimbursement of business expenses to employees/shareholders.'),
(4, 'Augusta Rule', 'P1', 'Foundation', 'Rent personal residence to S-Corp for business meetings up to 14 days/year. Rental income tax-free to homeowner; deductible to S-Corp.'),
(5, 'Asset Reimbursement', 'P1', 'Foundation', 'S-Corp reimburses shareholder for business use of personally-owned assets (computer, furniture, equipment).'),
(6, 'Hiring Kids', 'P1', 'Foundation', 'Employ children in family business. Wages deductible to business; potentially tax-free to child.'),
-- Phase 2: Core Deductions (7-14)
(7, 'Depreciation Optimization', 'P2', 'Core Deductions', 'Maximize first-year depreciation deductions through Section 179 expensing and bonus depreciation on qualifying business property.'),
(8, 'Home Office Deduction', 'P2', 'Core Deductions', 'Deduct expenses for business use of home if you have a dedicated workspace.'),
(9, 'Vehicle / Mileage Deduction', 'P2', 'Core Deductions', 'Deduct business use of vehicle via mileage rate or actual expenses.'),
(10, 'Heavy Vehicle Deduction', 'P2', 'Core Deductions', 'Vehicles over 6,000 lbs GVWR qualify for enhanced depreciation deductions.'),
(11, 'QBI Deduction Optimization', 'P2', 'Core Deductions', 'Qualified Business Income deduction allows up to 20% deduction on pass-through business income.'),
(12, 'Business Travel & Entertainment', 'P2', 'Core Deductions', 'Deduct ordinary and necessary business travel, meals, and related expenses.'),
(13, 'Section 105 Medical Reimbursement Plan', 'P2', 'Core Deductions', 'Employer-sponsored plan that reimburses employees (and their families) for qualified medical and wellness expenses. Reimbursements are deductible to the business and tax-free to the employee—no income tax, no FICA.'),
(14, 'Timing Strategies', 'P2', 'Core Deductions', 'Accelerate deductions and/or defer income to optimize tax across years.'),
-- Phase 3: Retirement & Benefits (15-24)
(15, 'SEP-IRA', 'P3', 'Retirement & Benefits', 'Simplified Employee Pension allowing employer contributions up to 25% of compensation.'),
(16, 'Solo 401(k)', 'P3', 'Retirement & Benefits', 'Retirement plan for self-employed individuals with no employees (except spouse). Highest contribution limits of any solo retirement plan.'),
(17, 'Cash Balance Plan', 'P3', 'Retirement & Benefits', 'Defined benefit plan with individual account balances. Allows much larger tax-deductible contributions than 401(k) alone.'),
(18, 'Mega Backdoor Roth', 'P3', 'Retirement & Benefits', 'After-tax 401(k) contributions converted to Roth. Allows Roth contributions far exceeding normal limits.'),
(19, 'HSA Contributions', 'P3', 'Retirement & Benefits', 'Health Savings Account with triple tax advantage.'),
(20, 'Backdoor Roth IRA', 'P3', 'Retirement & Benefits', 'Contribute to non-deductible Traditional IRA, then convert to Roth. Bypasses Roth income limits.'),
(21, 'Roth Conversion Strategy', 'P3', 'Retirement & Benefits', 'Convert Traditional IRA/401(k) to Roth. Pay tax now; future growth and withdrawals tax-free.'),
(22, 'Employer 401(k) Match', 'P3', 'Retirement & Benefits', 'Tax-deductible employer matching contributions to employee 401(k) accounts.'),
(23, 'Profit Sharing Contribution', 'P3', 'Retirement & Benefits', 'Employer contribution component of 401(k) allowing discretionary contributions up to 25% of compensation.'),
(24, 'Catch-Up Contributions', 'P3', 'Retirement & Benefits', 'Additional retirement contributions for participants age 50+.'),
-- Phase 4: Credits & Multistate (25-31)
(25, 'R&D Tax Credit', 'P4', 'Credits & Multistate', 'Credit for qualified research expenses. Available to businesses developing new/improved products, processes, software, or formulas.'),
(26, 'WOTC (Work Opportunity Tax Credit)', 'P4', 'Credits & Multistate', 'Credit for hiring employees from targeted groups facing employment barriers.'),
(27, 'PTET Election', 'P4', 'Credits & Multistate', 'Pass-Through Entity Tax allows S-Corps and partnerships to pay state income tax at entity level. Bypasses $10,000 SALT cap (now $40,000 under OBBBA).'),
(28, 'Disabled Access Credit', 'P4', 'Credits & Multistate', 'Tax credit for small businesses making accessibility improvements for disabled individuals.'),
(29, 'Energy Efficiency Credits', 'P4', 'Credits & Multistate', 'Credits for clean vehicles, energy-efficient buildings, and renewable energy investments.'),
(30, 'State-Specific Credits', 'P4', 'Credits & Multistate', 'Various state-level tax credits and incentives that vary by jurisdiction.'),
(31, 'Small Employer Health Credit', 'P4', 'Credits & Multistate', 'Tax credit for small employers providing health insurance to employees.'),
-- Phase 5: Real Estate & PAL (32-39)
(32, 'RE Professional Status', 'P5', 'Real Estate & PAL', 'Qualify as real estate professional to deduct rental losses against ordinary income.'),
(33, 'Cost Segregation Study', 'P5', 'Real Estate & PAL', 'Engineering study that accelerates depreciation on real estate components.'),
(34, 'STR Loophole', 'P5', 'Real Estate & PAL', 'Short-term rentals with average stay ≤7 days treated as non-passive, allowing loss deductions.'),
(35, 'Self-Rental Loophole', 'P5', 'Real Estate & PAL', 'Rent property to your own business; rental income recharacterized as non-passive to offset PALs.'),
(36, '1031 Exchange', 'P5', 'Real Estate & PAL', 'Defer capital gains by exchanging like-kind real property.'),
(37, 'Grouping Election (§469)', 'P5', 'Real Estate & PAL', 'Group multiple rental activities together for material participation testing.'),
(38, 'Qualified Opportunity Zone', 'P5', 'Real Estate & PAL', 'Invest capital gains in Qualified Opportunity Zone Funds for deferral and potential exclusion.'),
(39, 'PIGs vs PALs Optimization', 'P5', 'Real Estate & PAL', 'Generate Passive Income Generators (PIGs) to unlock suspended Passive Activity Losses (PALs).'),
-- Phase 6: Acquisitions & Leverage (40-48)
(40, 'Equipment Leasing Strategy', 'P6', 'Acquisitions & Leverage', 'Strategic purchase or lease of business equipment for depreciation deductions.'),
(41, 'Software RTU (Right to Use)', 'P6', 'Acquisitions & Leverage', 'Software licensing with amortization or immediate expensing.'),
(42, 'Oil & Gas Investments', 'P6', 'Acquisitions & Leverage', 'Oil and gas investments offer unique tax deductions: intangible drilling costs (IDCs) and depletion.'),
(43, 'Film/Entertainment Credits', 'P6', 'Acquisitions & Leverage', 'Invest in qualified productions and deduct production costs as incurred.'),
(44, 'Conservation Easement (Acquisition)', 'P6', 'Acquisitions & Leverage', 'Acquire land and donate conservation easement for charitable deduction.'),
(45, 'Installment Sale', 'P6', 'Acquisitions & Leverage', 'Defer gain recognition by receiving payments over time.'),
(46, 'Structured Sale (DST)', 'P6', 'Acquisitions & Leverage', 'Installment sale to irrevocable trust or DST investment for tax deferral.'),
(47, 'Captive Insurance', 'P6', 'Acquisitions & Leverage', 'Create wholly-owned insurance company to insure business risks.'),
(48, 'Family Management Company', 'P6', 'Acquisitions & Leverage', 'Establish a separate LLC or S-Corp owned by family members to provide management, consulting, or administrative services to the primary operating business.'),
-- Phase 7: Exit & Wealth Transfer (49-59)
(49, 'QSBS Exclusion (§1202)', 'P7', 'Exit & Wealth Transfer', 'Exclude up to 100% of gain (up to $15M or 10x basis post-OBBBA) on Qualified Small Business Stock held 5+ years.'),
(50, 'S-Corp to C-Corp Conversion', 'P7', 'Exit & Wealth Transfer', 'Revoke S-Corp election to become C-Corp for QSBS eligibility or other planning.'),
(51, 'Installment Sale of Business', 'P7', 'Exit & Wealth Transfer', 'Spread gain recognition on business sale over payment period.'),
(52, 'ESOP Sale', 'P7', 'Exit & Wealth Transfer', 'Sell company to ESOP. Seller can defer gain by reinvesting in Qualified Replacement Property.'),
(53, 'Intentionally Defective Grantor Trust (IDGT)', 'P7', 'Exit & Wealth Transfer', 'Sell assets to grantor trust; income taxed to grantor but assets removed from estate.'),
(54, 'Grantor Retained Annuity Trust (GRAT)', 'P7', 'Exit & Wealth Transfer', 'Transfer assets to trust; retain annuity; remainder passes to heirs at reduced gift tax.'),
(55, 'Family Limited Partnership', 'P7', 'Exit & Wealth Transfer', 'Transfer assets to FLP, applying valuation discounts for gift/estate tax.'),
(56, 'Buy-Sell Agreement Funding', 'P7', 'Exit & Wealth Transfer', 'Agreement among business owners governing transfer of interests at death, disability, or departure.'),
(57, 'Charitable Remainder Trust (CRT)', 'P7', 'Exit & Wealth Transfer', 'Irrevocable trust paying income to donor for life; remainder to charity.'),
(58, 'Private Placement Life Insurance (PPLI)', 'P7', 'Exit & Wealth Transfer', 'Life insurance policy with investment component; tax-free growth and death benefit.'),
(59, 'Dynasty Trust', 'P7', 'Exit & Wealth Transfer', 'Long-term trust designed to transfer wealth across multiple generations.'),
-- Phase 8: Charitable & Philanthropic (60-70)
(60, 'Donor Advised Fund (DAF)', 'P8', 'Charitable & Philanthropic', 'Charitable giving account at sponsoring organization. Immediate deduction at contribution; grants to charities over time.'),
(61, 'Qualified Charitable Distribution (QCD)', 'P8', 'Charitable & Philanthropic', 'Direct transfer from IRA to charity. Counts toward RMD but excluded from income.'),
(62, 'Charitable Lead Trust (CLAT/CLUT)', 'P8', 'Charitable & Philanthropic', 'Irrevocable trust pays income to charity for term; remainder to heirs at reduced gift/estate tax.'),
(63, 'Private Foundation', 'P8', 'Charitable & Philanthropic', 'Separately incorporated charity controlled by donor/family.'),
(64, 'Appreciated Stock Donation', 'P8', 'Charitable & Philanthropic', 'Donate appreciated stock directly to charity; avoid capital gains and receive FMV deduction.'),
(65, 'Charitable Bargain Sale', 'P8', 'Charitable & Philanthropic', 'Sell property to charity for less than FMV. Part sale, part gift.'),
(66, 'Conservation Contribution', 'P8', 'Charitable & Philanthropic', 'Donate easement on existing property; retain ownership but give up development rights.'),
(67, 'Charitable Gift Annuity', 'P8', 'Charitable & Philanthropic', 'Transfer assets to charity in exchange for fixed lifetime annuity payments.'),
(68, 'Pooled Income Fund', 'P8', 'Charitable & Philanthropic', 'Contribute to pooled fund maintained by charity; receive pro-rata share of income for life.'),
(69, 'Supporting Organization', 'P8', 'Charitable & Philanthropic', 'Hybrid between DAF and private foundation. Public charity status with more control.'),
(70, 'Bunching Strategy', 'P8', 'Charitable & Philanthropic', 'Alternate between itemizing deductions and taking standard deduction by timing charitable gifts.');

-- Update strategies with preserved data from backup using the mapping
UPDATE public.strategies s
SET 
  irc_citation = b.irc_citation,
  description = b.description,
  typical_savings_low = b.typical_savings_low,
  typical_savings_high = b.typical_savings_high,
  strategy_number = b.strategy_number,
  savings_low = b.savings_low,
  savings_high = b.savings_high,
  irc_sections = b.irc_sections,
  client_overview = b.client_overview,
  implementation = b.implementation,
  forms_required = b.forms_required,
  risk_level = b.risk_level,
  irs_scrutiny = b.irs_scrutiny,
  parent_strategy = b.parent_strategy,
  tier = b.tier,
  created_at = b.created_at,
  tool_url = b.tool_url,
  tool_name = b.tool_name,
  documents = b.documents
FROM strategy_backup b, id_map m
WHERE m.new_id = s.id AND m.old_id = b.id;

-- Re-add the foreign key constraint
ALTER TABLE public.client_strategies 
ADD CONSTRAINT client_strategies_strategy_id_fkey 
FOREIGN KEY (strategy_id) REFERENCES public.strategies(id);

-- Cleanup
DROP TABLE id_map;
DROP TABLE strategy_backup;