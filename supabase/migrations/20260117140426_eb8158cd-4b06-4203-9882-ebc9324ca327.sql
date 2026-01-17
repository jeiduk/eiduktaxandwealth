-- Create table for storing client account default mappings (remembered mappings)
CREATE TABLE public.client_account_defaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  pf_category TEXT NOT NULL CHECK (pf_category IN ('gross_revenue', 'materials_subs', 'owner_pay', 'tax', 'opex', 'exclude')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, account_name)
);

-- Enable Row Level Security
ALTER TABLE public.client_account_defaults ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their client account defaults"
ON public.client_account_defaults
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_account_defaults.client_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert client account defaults"
ON public.client_account_defaults
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_account_defaults.client_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update client account defaults"
ON public.client_account_defaults
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_account_defaults.client_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete client account defaults"
ON public.client_account_defaults
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_account_defaults.client_id
    AND c.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_account_defaults_updated_at
BEFORE UPDATE ON public.client_account_defaults
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_client_account_defaults_client_id ON public.client_account_defaults(client_id);

-- Update review_account_mappings to use new category values
ALTER TABLE public.review_account_mappings 
DROP CONSTRAINT review_account_mappings_pf_category_check;

ALTER TABLE public.review_account_mappings 
ADD CONSTRAINT review_account_mappings_pf_category_check 
CHECK (pf_category IN ('gross_revenue', 'materials_subs', 'owner_pay', 'tax', 'opex', 'exclude'));