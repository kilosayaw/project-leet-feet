-- Create shared_sequences table to track sequence sharing
CREATE TABLE public.shared_sequences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id uuid NOT NULL REFERENCES public.sequences(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  shared_with_email text NOT NULL,
  token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  viewed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shared_sequences ENABLE ROW LEVEL SECURITY;

-- Users can create shares for their own sequences
CREATE POLICY "Users can share their own sequences"
ON public.shared_sequences
FOR INSERT
WITH CHECK (
  auth.uid() = shared_by AND
  EXISTS (
    SELECT 1 FROM public.sequences
    WHERE sequences.id = shared_sequences.sequence_id
    AND sequences.user_id = auth.uid()
  )
);

-- Users can view shares where they are the recipient
CREATE POLICY "Users can view sequences shared with them"
ON public.shared_sequences
FOR SELECT
USING (
  auth.uid() = shared_by OR
  auth.jwt() ->> 'email' = shared_with_email
);

-- Users can view shares by token (for unauthenticated access)
CREATE POLICY "Anyone can view share by token"
ON public.shared_sequences
FOR SELECT
USING (true);

-- Index for faster token lookups
CREATE INDEX idx_shared_sequences_token ON public.shared_sequences(token);
CREATE INDEX idx_shared_sequences_email ON public.shared_sequences(shared_with_email);