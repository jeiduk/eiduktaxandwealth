-- Add tax_rate to clients table
ALTER TABLE public.clients 
ADD COLUMN tax_rate decimal DEFAULT 0.37;

-- Rename actual_savings to deduction_amount in client_strategies
ALTER TABLE public.client_strategies 
RENAME COLUMN actual_savings TO deduction_amount;