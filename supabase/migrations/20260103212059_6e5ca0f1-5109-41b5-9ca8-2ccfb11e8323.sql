-- Drop dependent tables first (respecting foreign key constraints)
DROP TABLE IF EXISTS client_access_tokens CASCADE;
DROP TABLE IF EXISTS client_documents CASCADE;
DROP TABLE IF EXISTS client_roadmaps CASCADE;
DROP TABLE IF EXISTS client_strategies CASCADE;
DROP TABLE IF EXISTS action_items CASCADE;
DROP TABLE IF EXISTS strategy_tracking CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS phase_status CASCADE;
DROP TABLE IF EXISTS roadmap_templates CASCADE;

-- Drop main tables
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Create new clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'S-Corp',
  package_tier TEXT NOT NULL DEFAULT 'Foundation',
  income_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_review_date DATE,
  notes TEXT
);

-- Create new strategies table (with integer id for strategy numbers 1-70)
CREATE TABLE public.strategies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phase TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  irc_citation TEXT,
  description TEXT,
  typical_savings_low INTEGER DEFAULT 0,
  typical_savings_high INTEGER DEFAULT 0
);

-- Create new client_strategies table
CREATE TABLE public.client_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  strategy_id INTEGER NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started',
  actual_savings INTEGER,
  implemented_date DATE,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, strategy_id)
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_strategies ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients (user can only see their own clients)
CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for strategies (everyone can read, no write)
CREATE POLICY "Anyone can view strategies"
  ON public.strategies FOR SELECT
  USING (true);

-- RLS policies for client_strategies (based on client ownership)
CREATE POLICY "Users can view their client strategies"
  ON public.client_strategies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_strategies.client_id
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can create client strategies"
  ON public.client_strategies FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_strategies.client_id
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their client strategies"
  ON public.client_strategies FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_strategies.client_id
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their client strategies"
  ON public.client_strategies FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = client_strategies.client_id
    AND clients.user_id = auth.uid()
  ));

-- Create trigger for updated_at on client_strategies
CREATE TRIGGER update_client_strategies_updated_at
  BEFORE UPDATE ON public.client_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();