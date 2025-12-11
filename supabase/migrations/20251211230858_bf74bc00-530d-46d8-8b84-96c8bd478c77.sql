-- Create a table for client welcome packets
CREATE TABLE public.client_welcome_packets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  service_level TEXT DEFAULT 'Tax Advisory',
  engagement_date DATE DEFAULT CURRENT_DATE,
  projected_savings_min INTEGER DEFAULT 26000,
  projected_savings_max INTEGER DEFAULT 87000,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_welcome_packets ENABLE ROW LEVEL SECURITY;

-- Create policies for advisor access
CREATE POLICY "Advisors can view their own welcome packets" 
ON public.client_welcome_packets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Advisors can create welcome packets" 
ON public.client_welcome_packets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advisors can update their own welcome packets" 
ON public.client_welcome_packets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Advisors can delete their own welcome packets" 
ON public.client_welcome_packets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_welcome_packets_updated_at
BEFORE UPDATE ON public.client_welcome_packets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add access token support for client portal viewing
CREATE POLICY "Token holders can view welcome packets" 
ON public.client_welcome_packets 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM client_access_tokens
  WHERE client_access_tokens.client_id = client_welcome_packets.client_id
  AND client_access_tokens.expires_at > now()
));