-- Create quarterly_reviews table
CREATE TABLE public.quarterly_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  quarter text NOT NULL,
  meeting_date date,
  status text DEFAULT 'in-progress' NOT NULL,
  
  -- Financial Goals
  revenue_ytd decimal,
  revenue_goal decimal,
  profit_ytd decimal,
  profit_goal decimal,
  draw_ytd decimal,
  draw_goal decimal,
  employees_current integer,
  employees_goal integer,
  
  -- Hurdles
  hurdle_1 text,
  hurdle_2 text,
  hurdle_3 text,
  
  -- Compliance
  compliance_payroll boolean DEFAULT false,
  compliance_estimates boolean DEFAULT false,
  compliance_books boolean DEFAULT false,
  compliance_notes text,
  
  -- Next steps
  next_meeting_date date,
  next_meeting_time time,
  
  -- Signatures
  client_signature boolean DEFAULT false,
  advisor_signature boolean DEFAULT false,
  
  -- Advisor info
  advisor_name text DEFAULT 'John Eiduk, CPA, CFP®',
  
  -- Override tax rate for this review
  tax_rate_override decimal,
  
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'in-progress', 'completed'))
);

-- Enable RLS
ALTER TABLE public.quarterly_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only access reviews for their own clients
CREATE POLICY "Users can view their client reviews"
ON public.quarterly_reviews
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.clients
  WHERE clients.id = quarterly_reviews.client_id
  AND clients.user_id = auth.uid()
));

CREATE POLICY "Users can create reviews for their clients"
ON public.quarterly_reviews
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.clients
  WHERE clients.id = quarterly_reviews.client_id
  AND clients.user_id = auth.uid()
));

CREATE POLICY "Users can update their client reviews"
ON public.quarterly_reviews
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.clients
  WHERE clients.id = quarterly_reviews.client_id
  AND clients.user_id = auth.uid()
));

CREATE POLICY "Users can delete their client reviews"
ON public.quarterly_reviews
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.clients
  WHERE clients.id = quarterly_reviews.client_id
  AND clients.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_quarterly_reviews_updated_at
BEFORE UPDATE ON public.quarterly_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();