-- Add service_level to client_roadmaps so we can merge welcome packet into roadmap
ALTER TABLE public.client_roadmaps 
ADD COLUMN service_level TEXT DEFAULT 'Tax Advisory';

-- Drop the separate welcome packets table since we're merging
DROP TABLE IF EXISTS public.client_welcome_packets;