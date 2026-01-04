-- Create onboarding_tasks table (reference tasks)
CREATE TABLE public.onboarding_tasks (
  id SERIAL PRIMARY KEY,
  phase TEXT NOT NULL,
  task_name TEXT NOT NULL,
  description TEXT,
  owner TEXT NOT NULL DEFAULT 'Advisor',
  default_deadline_days INTEGER NOT NULL DEFAULT 7,
  strategy_ref TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- Anyone can view onboarding tasks (they're reference data)
CREATE POLICY "Anyone can view onboarding tasks"
ON public.onboarding_tasks
FOR SELECT
USING (true);

-- Create client_onboarding table (per-client task tracking)
CREATE TABLE public.client_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES public.onboarding_tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, task_id)
);

-- Enable RLS
ALTER TABLE public.client_onboarding ENABLE ROW LEVEL SECURITY;

-- Users can view their client's onboarding
CREATE POLICY "Users can view their client onboarding"
ON public.client_onboarding
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = client_onboarding.client_id
  AND clients.user_id = auth.uid()
));

-- Users can create onboarding for their clients
CREATE POLICY "Users can create client onboarding"
ON public.client_onboarding
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = client_onboarding.client_id
  AND clients.user_id = auth.uid()
));

-- Users can update their client onboarding
CREATE POLICY "Users can update client onboarding"
ON public.client_onboarding
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = client_onboarding.client_id
  AND clients.user_id = auth.uid()
));

-- Users can delete their client onboarding
CREATE POLICY "Users can delete client onboarding"
ON public.client_onboarding
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = client_onboarding.client_id
  AND clients.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_client_onboarding_updated_at
BEFORE UPDATE ON public.client_onboarding
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed onboarding tasks
INSERT INTO public.onboarding_tasks (phase, task_name, description, owner, default_deadline_days, strategy_ref, sort_order) VALUES
-- Phase 1: Setup (Days 1-15)
('Setup', 'Engagement Letter Signed', 'Client signs engagement letter and fee agreement', 'Client', 1, NULL, 1),
('Setup', 'Portal Account Setup', 'Create client portal account and send login credentials', 'Advisor', 2, NULL, 2),
('Setup', 'Kickoff Meeting Scheduled', 'Schedule initial strategy kickoff call', 'Both', 3, NULL, 3),
('Setup', 'Tax Returns Collected', 'Gather last 3 years of personal and business tax returns', 'Client', 7, NULL, 4),
('Setup', 'Formation Documents Gathered', 'Collect articles of incorporation, operating agreements, bylaws', 'Client', 7, NULL, 5),
('Setup', 'P&L Statements Gathered', 'Obtain current year P&L and prior year financials', 'Client', 10, NULL, 6),
('Setup', 'Payroll Information Collected', 'Gather payroll reports, W-2s, and compensation history', 'Client', 10, NULL, 7),
('Setup', 'Tax Analysis Complete', 'Complete comprehensive tax situation analysis', 'Advisor', 12, NULL, 8),
('Setup', 'Tax Blueprint Presented', 'Present customized tax strategy blueprint to client', 'Advisor', 14, NULL, 9),
('Setup', 'Strategy Approval Received', 'Client approves recommended strategies for implementation', 'Client', 15, NULL, 10),

-- Phase 2: Foundation (Days 16-30)
('Foundation', 'Reasonable Comp Analysis', 'Complete reasonable compensation study for S-Corp', 'Advisor', 18, '#1', 11),
('Foundation', 'Payroll Adjustments Made', 'Implement optimized salary and distribution structure', 'Advisor', 20, '#1', 12),
('Foundation', 'Accountable Plan Setup', 'Establish accountable plan for business expense reimbursements', 'Advisor', 22, '#3', 13),
('Foundation', 'Mileage Tracking Started', 'Set up mileage tracking app and logging procedures', 'Client', 22, '#4', 14),
('Foundation', 'Vehicle Strategy Implemented', 'Determine optimal vehicle ownership and deduction method', 'Advisor', 24, '#4', 15),
('Foundation', 'Health Insurance Structured', 'Set up health insurance premium deduction through business', 'Advisor', 26, '#6', 16),
('Foundation', 'Family Employment Reviewed', 'Evaluate opportunities for employing family members', 'Advisor', 28, '#8', 17),
('Foundation', 'Corporate Compliance Check', 'Verify corporate formalities and annual requirements', 'Advisor', 30, NULL, 18),

-- Phase 3: Accounting (Days 31-45)
('Accounting', 'Accounting System Review', 'Review current bookkeeping setup and software', 'Advisor', 32, NULL, 19),
('Accounting', 'Chart of Accounts Updated', 'Optimize chart of accounts for tax strategy tracking', 'Advisor', 35, NULL, 20),
('Accounting', 'Bookkeeping Transition', 'Complete transition to recommended bookkeeping solution', 'Both', 38, NULL, 21),
('Accounting', 'Bank Reconciliation Current', 'Ensure all accounts are reconciled to date', 'Advisor', 40, NULL, 22),
('Accounting', 'Expense Tracker Setup', 'Configure expense tracking categories and workflows', 'Advisor', 42, NULL, 23),
('Accounting', 'Receipt Management System', 'Set up digital receipt capture and organization', 'Client', 45, NULL, 24),

-- Phase 4: Retirement (Days 46-90)
('Retirement', 'First Quarterly Review', 'Complete first quarterly tax planning review', 'Advisor', 60, NULL, 25),
('Retirement', 'Retirement Plan Analysis', 'Analyze optimal retirement plan structure', 'Advisor', 70, '#20', 26),
('Retirement', 'Retirement Plan Setup', 'Establish and fund recommended retirement plan', 'Both', 80, '#20', 27),
('Retirement', 'Investment Strategy Coordinated', 'Coordinate retirement investments with tax strategy', 'Advisor', 85, NULL, 28),
('Retirement', 'Ongoing Monitoring Established', 'Set up quarterly review schedule and monitoring', 'Advisor', 90, NULL, 29),
('Retirement', 'Onboarding Complete', 'All initial setup tasks completed, transition to ongoing service', 'Advisor', 90, NULL, 30);