-- Add tool and document fields to strategies table
ALTER TABLE public.strategies
ADD COLUMN IF NOT EXISTS strategy_number text,
ADD COLUMN IF NOT EXISTS tool_url text,
ADD COLUMN IF NOT EXISTS tool_name text,
ADD COLUMN IF NOT EXISTS documents jsonb DEFAULT '[]'::jsonb;

-- Add document statuses tracking to client_strategies table
ALTER TABLE public.client_strategies
ADD COLUMN IF NOT EXISTS document_statuses jsonb DEFAULT '{}'::jsonb;

-- Update strategy_number for existing strategies (use id as base)
UPDATE public.strategies 
SET strategy_number = '#' || id::text 
WHERE strategy_number IS NULL;

-- Add tool URLs and names for first few strategies
UPDATE public.strategies SET 
  tool_url = 'https://tools.eiduktaxandwealth.com/reasonable-comp-calculator.html',
  tool_name = 'Open Reasonable Comp Calculator',
  documents = '[
    {"id": "comp-study", "name": "Compensation Study"},
    {"id": "job-desc", "name": "Job Description"},
    {"id": "board-res", "name": "Board Resolution"},
    {"id": "payroll-records", "name": "Payroll Records"}
  ]'::jsonb
WHERE id = 1;

UPDATE public.strategies SET 
  tool_url = 'https://tools.eiduktaxandwealth.com/entity-comparison.html',
  tool_name = 'Open Entity Comparison Tool',
  documents = '[
    {"id": "entity-docs", "name": "Entity Formation Docs"},
    {"id": "operating-agreement", "name": "Operating Agreement"},
    {"id": "tax-returns", "name": "Prior Tax Returns"}
  ]'::jsonb
WHERE id = 2;

UPDATE public.strategies SET 
  tool_url = 'https://tools.eiduktaxandwealth.com/basis-tracker.html',
  tool_name = 'Open Basis Tracker',
  documents = '[
    {"id": "basis-schedule", "name": "Basis Schedule"},
    {"id": "k1-forms", "name": "K-1 Forms"},
    {"id": "contribution-records", "name": "Contribution Records"}
  ]'::jsonb
WHERE id = 3;

UPDATE public.strategies SET 
  tool_url = 'https://tools.eiduktaxandwealth.com/accountable-plan.html',
  tool_name = 'Open Accountable Plan Generator',
  documents = '[
    {"id": "expense-policy", "name": "Expense Policy"},
    {"id": "receipts", "name": "Expense Receipts"}
  ]'::jsonb
WHERE id = 4;

UPDATE public.strategies SET 
  tool_url = 'https://tools.eiduktaxandwealth.com/home-office.html',
  tool_name = 'Open Home Office Calculator',
  documents = '[
    {"id": "floor-plan", "name": "Floor Plan/Measurements"},
    {"id": "utility-bills", "name": "Utility Bills"}
  ]'::jsonb
WHERE id = 5;

UPDATE public.strategies SET 
  tool_url = 'https://tools.eiduktaxandwealth.com/vehicle-deduction.html',
  tool_name = 'Open Vehicle Deduction Calculator',
  documents = '[
    {"id": "mileage-log", "name": "Mileage Log"},
    {"id": "vehicle-title", "name": "Vehicle Title"}
  ]'::jsonb
WHERE id = 6;