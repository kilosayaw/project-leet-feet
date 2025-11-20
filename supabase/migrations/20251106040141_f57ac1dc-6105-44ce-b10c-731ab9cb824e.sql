-- Fix 1: Replace overly permissive shared_sequences policy with token-based access
-- Drop ALL existing policies on shared_sequences to start fresh
DROP POLICY IF EXISTS "Anyone can view share by token" ON shared_sequences;
DROP POLICY IF EXISTS "Users can view sequences they shared or received" ON shared_sequences;
DROP POLICY IF EXISTS "Recipients can mark shares as viewed" ON shared_sequences;
DROP POLICY IF EXISTS "Users can share their own sequences" ON shared_sequences;
DROP POLICY IF EXISTS "Users can view sequences shared with them" ON shared_sequences;

-- Create a security definer function for token-based access
CREATE OR REPLACE FUNCTION public.get_shared_sequence_by_token(_token text)
RETURNS TABLE (
  id uuid,
  sequence_id uuid,
  shared_by uuid,
  shared_with_email text,
  viewed boolean,
  created_at timestamptz,
  token text,
  sequence_name text,
  sequence_bpm integer,
  sequence_beats jsonb,
  sequence_audio_url text,
  sequence_audio_filename text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ss.id,
    ss.sequence_id,
    ss.shared_by,
    ss.shared_with_email,
    ss.viewed,
    ss.created_at,
    ss.token,
    s.name as sequence_name,
    s.bpm as sequence_bpm,
    s.beats as sequence_beats,
    s.audio_url as sequence_audio_url,
    s.audio_filename as sequence_audio_filename
  FROM shared_sequences ss
  JOIN sequences s ON s.id = ss.sequence_id
  WHERE ss.token = _token;
$$;

-- Create new restrictive SELECT policy for authenticated users
CREATE POLICY "Users can view sequences they shared or received"
ON shared_sequences FOR SELECT
USING (
  auth.uid() = shared_by OR 
  (auth.jwt() ->> 'email') = shared_with_email
);

-- Add UPDATE policy for recipients to mark as viewed
CREATE POLICY "Recipients can mark shares as viewed"
ON shared_sequences FOR UPDATE
USING (
  (auth.jwt() ->> 'email') = shared_with_email
)
WITH CHECK (
  (auth.jwt() ->> 'email') = shared_with_email
);

-- Recreate INSERT policy for sharing
CREATE POLICY "Users can share their own sequences"
ON shared_sequences FOR INSERT
WITH CHECK (
  auth.uid() = shared_by AND 
  EXISTS (
    SELECT 1 FROM sequences
    WHERE sequences.id = shared_sequences.sequence_id 
    AND sequences.user_id = auth.uid()
  )
);

-- Fix 2: Add database constraints for input validation
ALTER TABLE sequences 
  DROP CONSTRAINT IF EXISTS sequences_name_length,
  DROP CONSTRAINT IF EXISTS sequences_bpm_range,
  ADD CONSTRAINT sequences_name_length CHECK (char_length(name) <= 200 AND char_length(name) > 0),
  ADD CONSTRAINT sequences_bpm_range CHECK (bpm >= 20 AND bpm <= 300);

ALTER TABLE shared_sequences
  DROP CONSTRAINT IF EXISTS shared_sequences_email_length,
  ADD CONSTRAINT shared_sequences_email_length CHECK (char_length(shared_with_email) <= 255 AND char_length(shared_with_email) > 0);