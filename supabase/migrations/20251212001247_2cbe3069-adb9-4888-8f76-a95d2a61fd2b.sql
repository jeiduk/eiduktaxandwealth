-- Create strategies master table with all tax strategies organized by phase
CREATE TABLE public.strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_number integer NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  phase integer NOT NULL CHECK (phase >= 1 AND phase <= 8),
  category text NOT NULL,
  has_calculator boolean DEFAULT false,
  calculator_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

-- Strategies are read-only for everyone (system data)
CREATE POLICY "Anyone can view strategies" 
ON public.strategies 
FOR SELECT 
USING (true);

-- Create client_strategies table to track strategy implementation per client
CREATE TABLE public.client_strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  strategy_id uuid NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'not_applicable')),
  quarterly_status jsonb DEFAULT '{"q1": null, "q2": null, "q3": null, "q4": null}'::jsonb,
  calculator_data jsonb DEFAULT '{}'::jsonb,
  estimated_savings numeric(12,2) DEFAULT 0,
  notes text,
  documentation_complete boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(client_id, strategy_id)
);

-- Enable RLS
ALTER TABLE public.client_strategies ENABLE ROW LEVEL SECURITY;

-- Advisors can manage their own client strategies
CREATE POLICY "Advisors can view their client strategies" 
ON public.client_strategies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Advisors can create client strategies" 
ON public.client_strategies 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advisors can update their client strategies" 
ON public.client_strategies 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Advisors can delete their client strategies" 
ON public.client_strategies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Token holders can view their strategies (view-only for clients)
CREATE POLICY "Token holders can view their strategies" 
ON public.client_strategies 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM client_access_tokens 
  WHERE client_access_tokens.client_id = client_strategies.client_id 
  AND client_access_tokens.expires_at > now()
));

-- Create trigger for updated_at
CREATE TRIGGER update_client_strategies_updated_at
BEFORE UPDATE ON public.client_strategies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the strategies from the uploaded files
INSERT INTO public.strategies (strategy_number, name, description, phase, category, has_calculator, calculator_type) VALUES
-- Phase 2: Compliance
(1, 'Monthly Compliance Calendar', 'Track monthly compliance tasks and deadlines', 2, 'Compliance', false, null),
(2, 'Quarterly Meeting Workpaper', 'S-Corp quarterly meeting documentation', 2, 'Compliance', true, 'quarterly_meeting'),

-- Phase 3: Core Strategies
(3, 'Reasonable Compensation - FICA', 'Calculate optimal salary for FICA savings', 3, 'Compensation', true, 'fica_calculator'),
(4, 'Reasonable Compensation - Cost Approach', 'Cost-based compensation analysis', 3, 'Compensation', true, 'cost_calculator'),
(5, 'Accountable Plan Policy', 'Employee expense reimbursement plan', 3, 'Deductions', true, 'accountable_plan'),
(6, 'Accountable Plan Expense Report', 'Track and submit business expenses', 3, 'Deductions', true, 'expense_report'),
(7, 'Home Office Deduction', 'Calculate home office deduction', 3, 'Deductions', true, 'home_office'),
(8, 'IRC 280A Rental Package', 'Augusta Rule rental documentation', 3, 'Deductions', true, 'irc_280a'),
(9, 'Vehicle Mileage Log', 'Business vehicle mileage tracking', 3, 'Deductions', true, 'mileage_log'),

-- Phase 4: Advanced Strategies
(10, 'Retirement Strategies Workpaper', 'Overall retirement planning worksheet', 4, 'Retirement', true, 'retirement_workpaper'),
(11, 'Profit Sharing 401(k)', '401(k) with profit sharing optimization', 4, 'Retirement', true, '401k_calculator'),
(12, 'Cash Balance Plan', 'Defined benefit plan analysis', 4, 'Retirement', true, 'cash_balance'),
(13, 'Annual Board Meeting Minutes', 'S-Corp board meeting documentation', 4, 'Governance', true, 'board_minutes'),
(14, 'Dual Entity Meeting Minutes', 'Multi-entity governance documentation', 4, 'Governance', true, 'dual_entity_minutes'),
(15, 'Board Advisory Agreement', 'Board advisor compensation structure', 4, 'Governance', true, 'advisory_agreement'),
(16, 'Family Management Company Guide', 'FMC implementation overview', 4, 'Family', true, 'fmc_guide'),
(17, 'FMC Setup Workpaper', 'Family Management Company setup checklist', 4, 'Family', true, 'fmc_setup'),
(18, 'FMC Operating Agreement', 'FMC operating agreement template', 4, 'Family', true, 'fmc_operating'),
(19, 'Children Employment Tracking', 'Minor children employment documentation', 4, 'Family', true, 'children_employment'),
(20, 'HRA Plan Document', 'Health Reimbursement Arrangement plan', 4, 'Benefits', true, 'hra_plan'),
(21, 'PTET Implementation Guide', 'Pass-through entity tax election guide', 4, 'Tax Elections', true, 'ptet_guide'),
(22, 'PTET Election Workpaper', 'PTET calculation and election tracking', 4, 'Tax Elections', true, 'ptet_workpaper'),
(23, 'Cost Segregation Study', 'Accelerated depreciation analysis', 4, 'Depreciation', true, 'cost_segregation'),
(24, 'Equipment & Vehicle Purchase', 'Section 179 and bonus depreciation planning', 4, 'Depreciation', true, 'equipment_vehicle'),

-- Phase 5: Real Estate
(25, 'Real Estate Material Participation', 'REPS material participation tracking', 5, 'Real Estate', true, 'material_participation'),
(26, 'STR Material Participation', 'Short-term rental activity log', 5, 'Real Estate', true, 'str_participation'),

-- Phase 6: Tax Planning
(27, 'Quarterly Estimated Tax', 'Estimated tax payment calculator', 6, 'Tax Planning', true, 'estimated_tax'),
(28, 'Roth Conversion Calculator', 'Roth conversion analysis and planning', 6, 'Tax Planning', true, 'roth_conversion');