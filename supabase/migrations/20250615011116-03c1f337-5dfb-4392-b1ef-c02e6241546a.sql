
-- Create settings table for storing application configuration
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  mapbox_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings table (make it accessible to all authenticated users)
CREATE POLICY "Anyone can view settings" 
  ON public.settings 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert settings" 
  ON public.settings 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update settings" 
  ON public.settings 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can delete settings" 
  ON public.settings 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Insert default Mapbox token
INSERT INTO public.settings (key, mapbox_token) 
VALUES ('mapbox_token', 'pk.eyJ1Ijoia2Vsb2xhc2VuamEiLCJhIjoiY21id3gzbnA0MTc1cTJrcHVuZHJyMWo2ciJ9.84jSVtrqyFb8MJwKFeGm1g')
ON CONFLICT (key) DO NOTHING;
