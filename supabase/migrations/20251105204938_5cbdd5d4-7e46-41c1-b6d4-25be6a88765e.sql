-- Create sequences table
CREATE TABLE public.sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  bpm INTEGER NOT NULL,
  beats JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own sequences" 
ON public.sequences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sequences" 
ON public.sequences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequences" 
ON public.sequences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sequences" 
ON public.sequences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_sequences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sequences_updated_at
BEFORE UPDATE ON public.sequences
FOR EACH ROW
EXECUTE FUNCTION public.update_sequences_updated_at();

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  false,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav']
);

-- Create storage policies for audio uploads
CREATE POLICY "Users can upload their own audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'audio-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own audio files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'audio-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own audio files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'audio-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);