-- Add contact columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS contact_first_name text,
ADD COLUMN IF NOT EXISTS contact_last_name text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text;

-- Note: clients.notes already exists, skipping

-- Create analyses table
CREATE TABLE public.analyses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    report_date date,
    pl_data jsonb,
    adjustments jsonb,
    raw_matches jsonb,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analyses"
ON public.analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses"
ON public.analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses"
ON public.analyses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
ON public.analyses FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_analyses_updated_at
BEFORE UPDATE ON public.analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create pl_analyses table
CREATE TABLE public.pl_analyses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    statement_year integer,
    revenue numeric,
    cogs numeric,
    gross_profit numeric,
    total_expenses numeric,
    net_income numeric,
    pl_data jsonb,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pl_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pl_analyses"
ON public.pl_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pl_analyses"
ON public.pl_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pl_analyses"
ON public.pl_analyses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pl_analyses"
ON public.pl_analyses FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_pl_analyses_updated_at
BEFORE UPDATE ON public.pl_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create pf_assessments table
CREATE TABLE public.pf_assessments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
    assessment_date date,
    period_start date,
    period_end date,
    total_revenue numeric,
    materials_subs numeric,
    real_revenue numeric,
    revenue_tier text,
    actual_profit numeric,
    actual_owner_pay numeric,
    actual_tax numeric,
    actual_opex numeric,
    target_profit numeric,
    target_owner_pay numeric,
    target_tax numeric,
    target_opex numeric,
    variance_profit numeric,
    variance_owner_pay numeric,
    variance_tax numeric,
    variance_opex numeric,
    health_score numeric,
    source_analysis_id uuid,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pf_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pf_assessments"
ON public.pf_assessments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pf_assessments"
ON public.pf_assessments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pf_assessments"
ON public.pf_assessments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pf_assessments"
ON public.pf_assessments FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_pf_assessments_updated_at
BEFORE UPDATE ON public.pf_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create custom_benchmarks table
CREATE TABLE public.custom_benchmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    category text,
    industry text,
    min_pct numeric,
    ideal_pct numeric,
    max_pct numeric,
    revenue_tier text,
    source text,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom_benchmarks"
ON public.custom_benchmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom_benchmarks"
ON public.custom_benchmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom_benchmarks"
ON public.custom_benchmarks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom_benchmarks"
ON public.custom_benchmarks FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_custom_benchmarks_updated_at
BEFORE UPDATE ON public.custom_benchmarks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create custom_mappings table
CREATE TABLE public.custom_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    account_label text,
    category text,
    pf_category text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom_mappings"
ON public.custom_mappings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom_mappings"
ON public.custom_mappings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom_mappings"
ON public.custom_mappings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom_mappings"
ON public.custom_mappings FOR DELETE
USING (auth.uid() = user_id);

-- Create custom_tax_line_mappings table
CREATE TABLE public.custom_tax_line_mappings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    account_label text,
    tax_line_key text,
    form_number text,
    usage_count integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_tax_line_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom_tax_line_mappings"
ON public.custom_tax_line_mappings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom_tax_line_mappings"
ON public.custom_tax_line_mappings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom_tax_line_mappings"
ON public.custom_tax_line_mappings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom_tax_line_mappings"
ON public.custom_tax_line_mappings FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_custom_tax_line_mappings_updated_at
BEFORE UPDATE ON public.custom_tax_line_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create pf_taps table (public read-only)
CREATE TABLE public.pf_taps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name text,
    revenue_min numeric,
    revenue_max numeric,
    profit_pct numeric,
    owner_pay_pct numeric,
    tax_pct numeric,
    opex_pct numeric
);

ALTER TABLE public.pf_taps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pf_taps"
ON public.pf_taps FOR SELECT
USING (true);

-- Note: pf_category_defaults already exists with different schema (has keyword, priority columns)
-- Adding description column to existing table instead
ALTER TABLE public.pf_category_defaults
ADD COLUMN IF NOT EXISTS description text;