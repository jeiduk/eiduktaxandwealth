-- Create table for storing P&L account mappings per review
CREATE TABLE public.review_account_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.quarterly_reviews(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  pf_category TEXT NOT NULL CHECK (pf_category IN ('revenue', 'cogs', 'profit', 'owner_pay', 'tax', 'opex', 'exclude')),
  parent_account TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, account_name)
);

-- Enable Row Level Security
ALTER TABLE public.review_account_mappings ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can view mappings for reviews they own (via client ownership)
CREATE POLICY "Users can view their review mappings"
ON public.review_account_mappings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.quarterly_reviews qr
    JOIN public.clients c ON qr.client_id = c.id
    WHERE qr.id = review_account_mappings.review_id
    AND c.user_id = auth.uid()
  )
);

-- Create policy: Users can insert mappings for their reviews
CREATE POLICY "Users can insert review mappings"
ON public.review_account_mappings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.quarterly_reviews qr
    JOIN public.clients c ON qr.client_id = c.id
    WHERE qr.id = review_account_mappings.review_id
    AND c.user_id = auth.uid()
  )
);

-- Create policy: Users can update their review mappings
CREATE POLICY "Users can update their review mappings"
ON public.review_account_mappings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.quarterly_reviews qr
    JOIN public.clients c ON qr.client_id = c.id
    WHERE qr.id = review_account_mappings.review_id
    AND c.user_id = auth.uid()
  )
);

-- Create policy: Users can delete their review mappings
CREATE POLICY "Users can delete their review mappings"
ON public.review_account_mappings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.quarterly_reviews qr
    JOIN public.clients c ON qr.client_id = c.id
    WHERE qr.id = review_account_mappings.review_id
    AND c.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_review_account_mappings_updated_at
BEFORE UPDATE ON public.review_account_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_review_account_mappings_review_id ON public.review_account_mappings(review_id);