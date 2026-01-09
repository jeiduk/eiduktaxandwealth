-- Create action_items table
CREATE TABLE public.action_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  review_id uuid REFERENCES quarterly_reviews(id) ON DELETE CASCADE NOT NULL,
  owner text NOT NULL CHECK (owner IN ('client', 'advisor')),
  description text,
  due_date date,
  completed boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (access through client ownership)
CREATE POLICY "Users can view action items for their reviews"
ON public.action_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM quarterly_reviews qr
    JOIN clients c ON c.id = qr.client_id
    WHERE qr.id = action_items.review_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create action items for their reviews"
ON public.action_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM quarterly_reviews qr
    JOIN clients c ON c.id = qr.client_id
    WHERE qr.id = action_items.review_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update action items for their reviews"
ON public.action_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM quarterly_reviews qr
    JOIN clients c ON c.id = qr.client_id
    WHERE qr.id = action_items.review_id
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete action items for their reviews"
ON public.action_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM quarterly_reviews qr
    JOIN clients c ON c.id = qr.client_id
    WHERE qr.id = action_items.review_id
    AND c.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_action_items_updated_at
BEFORE UPDATE ON public.action_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();