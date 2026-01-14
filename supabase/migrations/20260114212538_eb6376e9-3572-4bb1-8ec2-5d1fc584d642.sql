-- Add tax_ytd field to quarterly_reviews for storing actual tax paid
ALTER TABLE public.quarterly_reviews 
ADD COLUMN IF NOT EXISTS tax_ytd numeric;