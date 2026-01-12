-- Add next_steps column to clients table for storing onboarding next steps progress
ALTER TABLE public.clients
ADD COLUMN next_steps JSONB DEFAULT '{"firstQuarterlyReview": {"completed": false, "notes": ""}, "ongoingMonitoring": {"completed": false, "notes": ""}, "onboardingComplete": {"completed": false, "notes": ""}}'::jsonb;