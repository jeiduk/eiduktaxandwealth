-- Create table to store quarterly meeting notes per client
CREATE TABLE public.quarterly_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  quarter TEXT NOT NULL,
  meeting_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_savings NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, quarter)
);

-- Enable RLS
ALTER TABLE public.quarterly_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Advisors can view their quarterly meetings"
ON public.quarterly_meetings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Advisors can create quarterly meetings"
ON public.quarterly_meetings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Advisors can update their quarterly meetings"
ON public.quarterly_meetings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Advisors can delete their quarterly meetings"
ON public.quarterly_meetings FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_quarterly_meetings_updated_at
BEFORE UPDATE ON public.quarterly_meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();