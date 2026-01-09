-- Add client_id column to reasonable_comp_files to link to clients
ALTER TABLE public.reasonable_comp_files 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for faster lookups by client
CREATE INDEX idx_reasonable_comp_files_client_id ON public.reasonable_comp_files(client_id);