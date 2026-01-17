-- Create pf_category_defaults table for global keyword patterns
CREATE TABLE public.pf_category_defaults (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword VARCHAR(100) NOT NULL,
  pl_category VARCHAR(50),
  pf_category VARCHAR(20) NOT NULL CHECK (pf_category IN ('gross_revenue', 'materials_subs', 'owner_pay', 'tax', 'opex', 'exclude')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- This is a read-only reference table, no RLS needed (public read access)
ALTER TABLE public.pf_category_defaults ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Anyone can read pf_category_defaults"
ON public.pf_category_defaults
FOR SELECT
TO authenticated
USING (true);