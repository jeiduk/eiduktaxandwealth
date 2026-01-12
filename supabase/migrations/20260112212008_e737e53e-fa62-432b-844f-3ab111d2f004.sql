-- Add due_date column to client_onboarding table
ALTER TABLE public.client_onboarding
ADD COLUMN due_date DATE;