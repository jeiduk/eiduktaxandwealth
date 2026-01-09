-- Add phase_status column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS phase_status jsonb 
DEFAULT '{"1":"not-started","2":"not-started","3":"not-started","4":"not-started","5":"not-started","6":"not-started","7":"not-started","8":"not-started"}'::jsonb;

-- Add review_id and tax_savings to client_strategies if not exist
ALTER TABLE public.client_strategies 
ADD COLUMN IF NOT EXISTS review_id uuid REFERENCES quarterly_reviews(id) ON DELETE SET NULL;

ALTER TABLE public.client_strategies 
ADD COLUMN IF NOT EXISTS tax_savings integer DEFAULT 0;