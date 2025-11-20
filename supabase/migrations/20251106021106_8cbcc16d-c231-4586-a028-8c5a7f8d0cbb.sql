-- Add audio file references to sequences table
ALTER TABLE public.sequences
ADD COLUMN audio_url text,
ADD COLUMN audio_filename text;