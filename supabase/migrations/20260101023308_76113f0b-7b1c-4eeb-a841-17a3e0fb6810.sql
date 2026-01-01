-- Drop existing tables that we're replacing
DROP TABLE IF EXISTS public.quarterly_meetings CASCADE;

-- Add new columns to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS entity_name text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS ein text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS fiscal_year_end text DEFAULT '12/31';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS filing_status text DEFAULT 'MFJ';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS service_tier text DEFAULT 'foundation';

-- Create meetings table
CREATE TABLE public.meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  meeting_date date NOT NULL DEFAULT current_date,
  quarter integer NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  tax_year integer NOT NULL,
  
  -- Financial snapshot
  ytd_gross_revenue numeric(12,2) DEFAULT 0,
  ytd_cogs numeric(12,2) DEFAULT 0,
  ytd_operating_expenses numeric(12,2) DEFAULT 0,
  ytd_net_income numeric(12,2) DEFAULT 0,
  
  -- Compensation
  current_salary numeric(12,2) DEFAULT 0,
  recommended_salary numeric(12,2) DEFAULT 0,
  ytd_distributions numeric(12,2) DEFAULT 0,
  
  -- Retirement contributions
  retirement_contribution_401k numeric(12,2) DEFAULT 0,
  retirement_contribution_profit_sharing numeric(12,2) DEFAULT 0,
  retirement_contribution_cash_balance numeric(12,2) DEFAULT 0,
  retirement_contribution_hsa numeric(12,2) DEFAULT 0,
  
  -- Estimated taxes
  federal_estimated_paid numeric(12,2) DEFAULT 0,
  state_estimated_paid numeric(12,2) DEFAULT 0,
  federal_estimated_due numeric(12,2) DEFAULT 0,
  state_estimated_due numeric(12,2) DEFAULT 0,
  
  -- Notes
  general_notes text,
  next_quarter_priorities text,
  
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  UNIQUE(client_id, quarter, tax_year)
);

-- Create strategy_tracking table
CREATE TABLE public.strategy_tracking (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  strategy_number integer NOT NULL CHECK (strategy_number >= 1 AND strategy_number <= 70),
  
  -- Quarterly checkboxes
  q1_active boolean DEFAULT false,
  q2_active boolean DEFAULT false,
  q3_active boolean DEFAULT false,
  q4_active boolean DEFAULT false,
  
  -- Savings
  estimated_savings numeric(12,2) DEFAULT 0,
  
  -- Documentation checklist (3 items per strategy)
  doc1_complete boolean DEFAULT false,
  doc2_complete boolean DEFAULT false,
  doc3_complete boolean DEFAULT false,
  
  -- Notes
  notes text,
  
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  UNIQUE(meeting_id, strategy_number)
);

-- Create phase_status table
CREATE TABLE public.phase_status (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  phase integer NOT NULL CHECK (phase >= 1 AND phase <= 8),
  status text DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'complete', 'maintaining')),
  
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  UNIQUE(client_id, phase)
);

-- Create action_items table
CREATE TABLE public.action_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  description text NOT NULL,
  responsible_party text CHECK (responsible_party IN ('client', 'advisor')),
  due_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'complete')),
  priority integer DEFAULT 2 CHECK (priority >= 1 AND priority <= 3),
  strategy_number integer CHECK (strategy_number >= 1 AND strategy_number <= 70),
  
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
CREATE POLICY "Advisors can view their own meetings"
  ON public.meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Advisors can create meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advisors can update their own meetings"
  ON public.meetings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Advisors can delete their own meetings"
  ON public.meetings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for strategy_tracking (through meeting ownership)
CREATE POLICY "Advisors can view their strategy tracking"
  ON public.strategy_tracking FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = strategy_tracking.meeting_id
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Advisors can create strategy tracking"
  ON public.strategy_tracking FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = strategy_tracking.meeting_id
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Advisors can update their strategy tracking"
  ON public.strategy_tracking FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = strategy_tracking.meeting_id
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Advisors can delete their strategy tracking"
  ON public.strategy_tracking FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = strategy_tracking.meeting_id
    AND meetings.user_id = auth.uid()
  ));

-- RLS Policies for phase_status (through client ownership)
CREATE POLICY "Advisors can view their phase status"
  ON public.phase_status FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = phase_status.client_id
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Advisors can create phase status"
  ON public.phase_status FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = phase_status.client_id
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Advisors can update their phase status"
  ON public.phase_status FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = phase_status.client_id
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Advisors can delete their phase status"
  ON public.phase_status FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = phase_status.client_id
    AND clients.user_id = auth.uid()
  ));

-- RLS Policies for action_items (through meeting ownership)
CREATE POLICY "Advisors can view their action items"
  ON public.action_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = action_items.meeting_id
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Advisors can create action items"
  ON public.action_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = action_items.meeting_id
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Advisors can update their action items"
  ON public.action_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = action_items.meeting_id
    AND meetings.user_id = auth.uid()
  ));

CREATE POLICY "Advisors can delete their action items"
  ON public.action_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.meetings
    WHERE meetings.id = action_items.meeting_id
    AND meetings.user_id = auth.uid()
  ));

-- Create indexes for better query performance
CREATE INDEX idx_meetings_client_id ON public.meetings(client_id);
CREATE INDEX idx_meetings_quarter_year ON public.meetings(quarter, tax_year);
CREATE INDEX idx_strategy_tracking_meeting_id ON public.strategy_tracking(meeting_id);
CREATE INDEX idx_phase_status_client_id ON public.phase_status(client_id);
CREATE INDEX idx_action_items_meeting_id ON public.action_items(meeting_id);
CREATE INDEX idx_action_items_status ON public.action_items(status);

-- Add triggers for updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_strategy_tracking_updated_at
  BEFORE UPDATE ON public.strategy_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phase_status_updated_at
  BEFORE UPDATE ON public.phase_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
  BEFORE UPDATE ON public.action_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();