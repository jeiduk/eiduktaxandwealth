-- Create a table for reasonable compensation defense files
CREATE TABLE public.reasonable_comp_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Step 1: Business Info
  business_name TEXT,
  ein TEXT,
  entity_type TEXT,
  state_of_incorporation TEXT,
  date_incorporated TEXT,
  industry TEXT,
  industry_naics TEXT,
  fiscal_year_end TEXT,
  annual_revenue TEXT,
  number_of_employees TEXT,
  
  -- Step 2: Officer Info
  officer_name TEXT,
  officer_title TEXT,
  ownership_percentage NUMERIC,
  years_with_company TEXT,
  
  -- Step 3: Time Allocation (stored as JSONB)
  time_allocation JSONB DEFAULT '{}',
  
  -- Step 4: Experience & Qualifications
  education TEXT,
  certifications TEXT,
  years_in_industry TEXT,
  prior_positions TEXT,
  unique_skills TEXT,
  
  -- Step 5: Compensation Data
  current_salary NUMERIC,
  current_bonus NUMERIC,
  current_benefits NUMERIC,
  current_retirement NUMERIC,
  current_other NUMERIC,
  comp_data_sources JSONB DEFAULT '[]',
  salary_low NUMERIC,
  salary_mid NUMERIC,
  salary_high NUMERIC,
  
  -- Step 6: Defense Summary
  defense_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reasonable_comp_files ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own reasonable comp files" 
ON public.reasonable_comp_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reasonable comp files" 
ON public.reasonable_comp_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reasonable comp files" 
ON public.reasonable_comp_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reasonable comp files" 
ON public.reasonable_comp_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reasonable_comp_files_updated_at
BEFORE UPDATE ON public.reasonable_comp_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();