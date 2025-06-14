
-- Create kendala_reports table for interactive chat forum
CREATE TABLE public.kendala_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  photo_url TEXT
);

-- Add RLS policies for kendala_reports
ALTER TABLE public.kendala_reports ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view kendala reports (admin can see all, drivers can see their own shipments)
CREATE POLICY "Users can view kendala reports" 
  ON public.kendala_reports 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to create kendala reports
CREATE POLICY "Authenticated users can create kendala reports" 
  ON public.kendala_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for kendala_reports table only
ALTER TABLE public.kendala_reports REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kendala_reports;

-- Create storage bucket for kendala photos
INSERT INTO storage.buckets (id, name, public) VALUES ('kendala-photos', 'kendala-photos', true);

-- Create policy for kendala photos bucket
CREATE POLICY "Anyone can view kendala photos" ON storage.objects FOR SELECT USING (bucket_id = 'kendala-photos');
CREATE POLICY "Authenticated users can upload kendala photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kendala-photos' AND auth.uid() IS NOT NULL);
