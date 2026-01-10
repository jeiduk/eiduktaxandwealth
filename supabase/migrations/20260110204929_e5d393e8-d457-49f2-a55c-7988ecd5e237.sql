-- Add title field to profiles for professional credentials (e.g., "CPA, CFP, MSCTA")
ALTER TABLE public.profiles 
ADD COLUMN title TEXT;