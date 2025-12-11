-- Create table for client roadmaps
CREATE TABLE public.client_roadmaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '90-Day Tax Strategy Roadmap',
  phase1_title TEXT NOT NULL DEFAULT 'Strategy Discovery',
  phase1_description TEXT NOT NULL DEFAULT 'Deep dive into your financial landscape',
  phase1_tasks JSONB NOT NULL DEFAULT '["Comprehensive financial assessment", "Tax liability analysis", "Opportunity identification", "Strategy alignment session"]'::jsonb,
  phase2_title TEXT NOT NULL DEFAULT 'Implementation',
  phase2_description TEXT NOT NULL DEFAULT 'Execute your personalized tax strategies',
  phase2_tasks JSONB NOT NULL DEFAULT '["Entity structure optimization", "Retirement planning integration", "Income timing strategies", "Documentation setup"]'::jsonb,
  phase3_title TEXT NOT NULL DEFAULT 'Optimization',
  phase3_description TEXT NOT NULL DEFAULT 'Fine-tune and maximize your savings',
  phase3_tasks JSONB NOT NULL DEFAULT '["Quarterly review scheduling", "Strategy refinement", "Year-end planning", "Long-term wealth building"]'::jsonb,
  estimated_savings_min INTEGER NOT NULL DEFAULT 15000,
  estimated_savings_max INTEGER NOT NULL DEFAULT 50000,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_roadmaps ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Advisors can view their own roadmaps" 
ON public.client_roadmaps 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Advisors can create roadmaps" 
ON public.client_roadmaps 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advisors can update their own roadmaps" 
ON public.client_roadmaps 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Advisors can delete their own roadmaps" 
ON public.client_roadmaps 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_client_roadmaps_updated_at
BEFORE UPDATE ON public.client_roadmaps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();