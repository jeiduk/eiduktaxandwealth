-- Update tool_url and tool_name for strategies based on the tools index file

-- Strategy #1: Reasonable Compensation
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/reasonable-comp-calculator.html',
    tool_name = 'Reasonable Compensation Calculator'
WHERE id = 1;

-- Also add FICA calculator as alternate for #1
-- (keeping primary on the main reasonable comp)

-- Strategy #3: Accountable Plan / Home Office / Vehicle
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/accountable-plan-expense-report.html',
    tool_name = 'Accountable Plan Expense Report'
WHERE id = 3;

-- Strategy #4: Augusta Rule
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/augusta-rule-package.html',
    tool_name = 'Augusta Rule Rental Package'
WHERE id = 4;

-- Strategy #5: Equipment & Vehicle
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/equipment-vehicle-workpaper.html',
    tool_name = 'Equipment & Vehicle Workpaper'
WHERE id = 5;

-- Strategy #6: Family Management Company
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/family-management-company-guide.html',
    tool_name = 'Family Management Company Guide'
WHERE id = 6;

-- Strategy #10: QBI Optimization
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/qbi_optimizer.html',
    tool_name = 'QBI Optimization Calculator'
WHERE id = 10;

-- Strategy #12: HRA
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/hra-setup-workpaper.html',
    tool_name = 'HRA Setup Workpaper'
WHERE id = 12;

-- Strategy #14: Retirement (general)
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/retirement-comparison.html',
    tool_name = 'Retirement Plan Comparison Calculator'
WHERE id = 14;

-- Strategy #15: Profit Sharing 401(k)
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/profit-sharing-401k.html',
    tool_name = 'Profit Sharing 401(k) Guide'
WHERE id = 15;

-- Strategy #16: Cash Balance Plan
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/cash-balance-guide.html',
    tool_name = 'Cash Balance Plan Guide'
WHERE id = 16;

-- Strategy #17: Mega Backdoor Roth
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/mega-backdoor-roth-calculator.html',
    tool_name = 'Mega Backdoor Roth Calculator'
WHERE id = 17;

-- Strategy #18: HSA
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/hsa-triple-tax-calculator.html',
    tool_name = 'HSA Triple Tax Calculator'
WHERE id = 18;

-- Strategy #19: Backdoor Roth IRA
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/backdoor-roth-guide.html',
    tool_name = 'Backdoor Roth IRA Guide'
WHERE id = 19;

-- Strategy #20: Roth Conversion
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/roth-conversion-calculator.html',
    tool_name = 'Roth Conversion Calculator'
WHERE id = 20;

-- Strategy #24: R&D Tax Credit
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/rd-tax-credit-qualifier.html',
    tool_name = 'R&D Tax Credit Qualifier'
WHERE id = 24;

-- Strategy #26: PTET
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/ptet-analyzer.html',
    tool_name = 'PTET Decision Calculator'
WHERE id = 26;

-- Strategy #31: RE Material Participation / REP Status
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/real-estate-material-participation-log.html',
    tool_name = 'RE Material Participation Log'
WHERE id = 31;

-- Strategy #32: Cost Segregation / HUD
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/cost-segregation-workpaper.html',
    tool_name = 'Cost Segregation Workpaper'
WHERE id = 32;

-- Strategy #33: STR Material Participation
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/str-material-participation.html',
    tool_name = 'STR Material Participation Log'
WHERE id = 33;

-- Strategy #34: Self-Rental Loophole
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/self-rental-analyzer.html',
    tool_name = 'Self-Rental Loophole Analyzer'
WHERE id = 34;

-- Strategy #35: 1031 Exchange
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/1031-exchange-tracker.html',
    tool_name = '1031 Exchange Timeline Tracker'
WHERE id = 35;

-- Strategy #36: PAL Grouping
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/pal-grouping-worksheet.html',
    tool_name = 'PAL Grouping Election Worksheet'
WHERE id = 36;

-- Strategy #38: PIGs vs PALs
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/pigs-vs-pals-calculator.html',
    tool_name = 'PIGs vs PALs Matching Calculator'
WHERE id = 38;

-- Strategy #45: Crypto Tax
UPDATE public.strategies 
SET tool_url = 'https://tools.eiduk.tax/crypto-tax-strategies.html',
    tool_name = 'Crypto Tax Strategies'
WHERE id = 45;