-- Add phases 4, 5, 6 to client_roadmaps table to match the HTML template
ALTER TABLE public.client_roadmaps
ADD COLUMN phase4_title text NOT NULL DEFAULT 'Advanced Strategies'::text,
ADD COLUMN phase4_description text NOT NULL DEFAULT 'Based on your situation, we''ll implement additional strategies like home office, retirement planning, and equipment purchases.'::text,
ADD COLUMN phase4_tasks jsonb NOT NULL DEFAULT '["Measure your home office space and take photos", "Provide information on any planned equipment purchases", "Review retirement plan options we present"]'::jsonb,
ADD COLUMN phase5_title text NOT NULL DEFAULT 'Documentation & Compliance'::text,
ADD COLUMN phase5_description text NOT NULL DEFAULT 'We''ll establish your ongoing compliance systems so everything runs smoothly month after month.'::text,
ADD COLUMN phase5_tasks jsonb NOT NULL DEFAULT '["Submit your first expense reimbursement form", "Submit your first monthly mileage log", "Review your Monthly Compliance Calendar"]'::jsonb,
ADD COLUMN phase6_title text NOT NULL DEFAULT 'Review & Celebrate!'::text,
ADD COLUMN phase6_description text NOT NULL DEFAULT 'We''ll review what we''ve accomplished, calculate your actual tax savings, and set up your quarterly planning schedule going forward.'::text,
ADD COLUMN phase6_tasks jsonb NOT NULL DEFAULT '["Attend your 90-day review meeting", "Schedule your quarterly planning meetings for the year", "Celebrate your tax savings!"]'::jsonb;

-- Update default values for existing phases to match the HTML template
UPDATE public.client_roadmaps SET
  phase1_title = 'Getting Started',
  phase1_description = 'We''ll gather your documents, analyze your current tax situation, and create your personalized strategy plan.',
  phase1_tasks = '["Prior 2 years tax returns (business & personal)", "Business formation documents (Articles, EIN letter, S-Corp election)", "Current year P&L and Balance Sheet", "Current payroll information and W-2s"]'::jsonb,
  phase2_title = 'Foundation Setup',
  phase2_description = 'We''ll implement your core S-Corp strategies including reasonable compensation, accountable plan, and expense tracking systems.',
  phase2_tasks = '["Review and approve your compensation analysis", "Set up a mileage tracking app (MileIQ, Everlance, etc.)", "Provide health insurance policy details", "Sign accountable plan policy document"]'::jsonb,
  phase3_title = 'Systems & Integration',
  phase3_description = 'We''ll optimize your bookkeeping system and set up reporting so you always know where you stand.',
  phase3_tasks = '["Connect bank and credit card feeds to accounting system", "Review chart of accounts updates", "Confirm monthly reporting preferences"]'::jsonb
WHERE true;

-- Update the default values for new roadmaps
ALTER TABLE public.client_roadmaps
ALTER COLUMN phase1_title SET DEFAULT 'Getting Started'::text,
ALTER COLUMN phase1_description SET DEFAULT 'We''ll gather your documents, analyze your current tax situation, and create your personalized strategy plan.'::text,
ALTER COLUMN phase1_tasks SET DEFAULT '["Prior 2 years tax returns (business & personal)", "Business formation documents (Articles, EIN letter, S-Corp election)", "Current year P&L and Balance Sheet", "Current payroll information and W-2s"]'::jsonb,
ALTER COLUMN phase2_title SET DEFAULT 'Foundation Setup'::text,
ALTER COLUMN phase2_description SET DEFAULT 'We''ll implement your core S-Corp strategies including reasonable compensation, accountable plan, and expense tracking systems.'::text,
ALTER COLUMN phase2_tasks SET DEFAULT '["Review and approve your compensation analysis", "Set up a mileage tracking app (MileIQ, Everlance, etc.)", "Provide health insurance policy details", "Sign accountable plan policy document"]'::jsonb,
ALTER COLUMN phase3_title SET DEFAULT 'Systems & Integration'::text,
ALTER COLUMN phase3_description SET DEFAULT 'We''ll optimize your bookkeeping system and set up reporting so you always know where you stand.'::text,
ALTER COLUMN phase3_tasks SET DEFAULT '["Connect bank and credit card feeds to accounting system", "Review chart of accounts updates", "Confirm monthly reporting preferences"]'::jsonb,
ALTER COLUMN estimated_savings_min SET DEFAULT 26000,
ALTER COLUMN estimated_savings_max SET DEFAULT 87000;