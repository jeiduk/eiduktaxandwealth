-- Add new columns to strategies table
ALTER TABLE public.strategies
  ADD COLUMN IF NOT EXISTS strategy_number VARCHAR(10),
  ADD COLUMN IF NOT EXISTS savings_low INTEGER,
  ADD COLUMN IF NOT EXISTS savings_high INTEGER,
  ADD COLUMN IF NOT EXISTS irc_sections TEXT,
  ADD COLUMN IF NOT EXISTS client_overview TEXT,
  ADD COLUMN IF NOT EXISTS what_it_is TEXT,
  ADD COLUMN IF NOT EXISTS implementation TEXT,
  ADD COLUMN IF NOT EXISTS forms_required TEXT,
  ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50),
  ADD COLUMN IF NOT EXISTS irs_scrutiny BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS parent_strategy INTEGER,
  ADD COLUMN IF NOT EXISTS tier VARCHAR(50),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Migrate data from old columns to new columns
UPDATE public.strategies SET 
  savings_low = typical_savings_low,
  savings_high = typical_savings_high,
  irc_sections = irc_citation,
  what_it_is = description
WHERE typical_savings_low IS NOT NULL 
   OR typical_savings_high IS NOT NULL 
   OR irc_citation IS NOT NULL 
   OR description IS NOT NULL;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_strategies_updated_at ON public.strategies;
CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();