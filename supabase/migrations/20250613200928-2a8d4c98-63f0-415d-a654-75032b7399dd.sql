
-- Create drivers table
CREATE TABLE public.drivers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    license_plate text NOT NULL
);

-- Insert driver data
INSERT INTO public.drivers (name, license_plate) VALUES
('MULYADI', 'T 9388 TC'),
('BAYU', 'B 9104 UXZ'),
('SUYANDI', 'B 9681 FXZ'),
('MULYANA', 'T 9863 TB'),
('TATANG', 'B 9670 FXZ'),
('DENDY', 'B 9671 FXZ'),
('GUNTORO', 'B 9224 UXZ'),
('AHMAD JAYADI', 'B 9219 UXZ'),
('ANDRI', 'B 9672 FXZ'),
('Rizky', 'B 9919 FXW');

-- Add driver_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN driver_id uuid REFERENCES public.drivers(id);

-- Remove supir column and add driver_id to shipments table
ALTER TABLE public.shipments 
DROP COLUMN supir,
ADD COLUMN driver_id uuid REFERENCES public.drivers(id),
ADD COLUMN current_lat float8,
ADD COLUMN current_lng float8;

-- Enable RLS on shipments table
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for drivers to see only their assigned shipments
CREATE POLICY "Drivers can view their assigned shipments" 
ON public.shipments 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.driver_id = shipments.driver_id
    )
);

-- Allow drivers to update their assigned shipments
CREATE POLICY "Drivers can update their assigned shipments" 
ON public.shipments 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.driver_id = shipments.driver_id
    )
);

-- Allow admins to view and update all shipments
CREATE POLICY "Admins can view all shipments" 
ON public.shipments 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can update all shipments" 
ON public.shipments 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can insert shipments" 
ON public.shipments 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can delete shipments" 
ON public.shipments 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);
