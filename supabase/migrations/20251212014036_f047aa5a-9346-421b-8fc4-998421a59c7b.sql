-- Drop existing check constraint and recreate to allow phase 0
ALTER TABLE public.strategies DROP CONSTRAINT IF EXISTS strategies_phase_check;
ALTER TABLE public.strategies ADD CONSTRAINT strategies_phase_check CHECK (phase >= 0 AND phase <= 8);