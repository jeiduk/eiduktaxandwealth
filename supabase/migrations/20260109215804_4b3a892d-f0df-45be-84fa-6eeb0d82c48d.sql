-- Add first_name and last_name columns to clients table
ALTER TABLE public.clients 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;