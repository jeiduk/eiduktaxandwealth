-- Create roadmap templates table (advisor creates these first)
CREATE TABLE public.roadmap_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  phase1_title text NOT NULL DEFAULT 'Getting Started'::text,
  phase1_description text NOT NULL DEFAULT 'We''ll gather your documents, analyze your current tax situation, and create your personalized strategy plan.'::text,
  phase1_tasks jsonb NOT NULL DEFAULT '["Prior 2 years tax returns (business & personal)", "Business formation documents (Articles, EIN letter, S-Corp election)", "Current year P&L and Balance Sheet", "Current payroll information and W-2s"]'::jsonb,
  phase2_title text NOT NULL DEFAULT 'Foundation Setup'::text,
  phase2_description text NOT NULL DEFAULT 'We''ll implement your core S-Corp strategies including reasonable compensation, accountable plan, and expense tracking systems.'::text,
  phase2_tasks jsonb NOT NULL DEFAULT '["Review and approve your compensation analysis", "Set up a mileage tracking app (MileIQ, Everlance, etc.)", "Provide health insurance policy details", "Sign accountable plan policy document"]'::jsonb,
  phase3_title text NOT NULL DEFAULT 'Systems & Integration'::text,
  phase3_description text NOT NULL DEFAULT 'We''ll optimize your bookkeeping system and set up reporting so you always know where you stand.'::text,
  phase3_tasks jsonb NOT NULL DEFAULT '["Connect bank and credit card feeds to accounting system", "Review chart of accounts updates", "Confirm monthly reporting preferences"]'::jsonb,
  phase4_title text NOT NULL DEFAULT 'Advanced Strategies'::text,
  phase4_description text NOT NULL DEFAULT 'Based on your situation, we''ll implement additional strategies like home office, retirement planning, and equipment purchases.'::text,
  phase4_tasks jsonb NOT NULL DEFAULT '["Measure your home office space and take photos", "Provide information on any planned equipment purchases", "Review retirement plan options we present"]'::jsonb,
  phase5_title text NOT NULL DEFAULT 'Documentation & Compliance'::text,
  phase5_description text NOT NULL DEFAULT 'We''ll establish your ongoing compliance systems so everything runs smoothly month after month.'::text,
  phase5_tasks jsonb NOT NULL DEFAULT '["Submit your first expense reimbursement form", "Submit your first monthly mileage log", "Review your Monthly Compliance Calendar"]'::jsonb,
  phase6_title text NOT NULL DEFAULT 'Review & Celebrate!'::text,
  phase6_description text NOT NULL DEFAULT 'We''ll review what we''ve accomplished, calculate your actual tax savings, and set up your quarterly planning schedule going forward.'::text,
  phase6_tasks jsonb NOT NULL DEFAULT '["Attend your 90-day review meeting", "Schedule your quarterly planning meetings for the year", "Celebrate your tax savings!"]'::jsonb,
  estimated_savings_min integer NOT NULL DEFAULT 26000,
  estimated_savings_max integer NOT NULL DEFAULT 87000,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on templates
ALTER TABLE public.roadmap_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates (advisor only)
CREATE POLICY "Advisors can view their own templates" 
ON public.roadmap_templates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Advisors can create templates" 
ON public.roadmap_templates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advisors can update their own templates" 
ON public.roadmap_templates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Advisors can delete their own templates" 
ON public.roadmap_templates FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_roadmap_templates_updated_at
BEFORE UPDATE ON public.roadmap_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add client access tokens for magic links
CREATE TABLE public.client_access_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  roadmap_id uuid NOT NULL REFERENCES public.client_roadmaps(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_accessed_at timestamp with time zone
);

-- Enable RLS 
ALTER TABLE public.client_access_tokens ENABLE ROW LEVEL SECURITY;

-- Advisors can manage tokens for their clients
CREATE POLICY "Advisors can view tokens for their clients" 
ON public.client_access_tokens FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_access_tokens.client_id 
    AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "Advisors can create tokens for their clients" 
ON public.client_access_tokens FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_access_tokens.client_id 
    AND clients.user_id = auth.uid()
  )
);

CREATE POLICY "Advisors can delete tokens for their clients" 
ON public.client_access_tokens FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients 
    WHERE clients.id = client_access_tokens.client_id 
    AND clients.user_id = auth.uid()
  )
);

-- Public policy to allow token validation (for magic link access)
CREATE POLICY "Anyone can validate tokens" 
ON public.client_access_tokens FOR SELECT 
USING (true);

-- Add task completion tracking to roadmaps
ALTER TABLE public.client_roadmaps
ADD COLUMN phase1_completed jsonb DEFAULT '[]'::jsonb,
ADD COLUMN phase2_completed jsonb DEFAULT '[]'::jsonb,
ADD COLUMN phase3_completed jsonb DEFAULT '[]'::jsonb,
ADD COLUMN phase4_completed jsonb DEFAULT '[]'::jsonb,
ADD COLUMN phase5_completed jsonb DEFAULT '[]'::jsonb,
ADD COLUMN phase6_completed jsonb DEFAULT '[]'::jsonb;

-- Create policy for clients to update their roadmap progress via token
CREATE POLICY "Token holders can update roadmap progress" 
ON public.client_roadmaps FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.client_access_tokens 
    WHERE client_access_tokens.roadmap_id = client_roadmaps.id 
    AND client_access_tokens.expires_at > now()
  )
);

-- Add template_id reference to client_roadmaps
ALTER TABLE public.client_roadmaps
ADD COLUMN template_id uuid REFERENCES public.roadmap_templates(id) ON DELETE SET NULL;