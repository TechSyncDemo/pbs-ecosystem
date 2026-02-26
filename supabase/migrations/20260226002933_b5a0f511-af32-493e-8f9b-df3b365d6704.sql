
-- Create authorizations table (parent categories/specializations)
CREATE TABLE public.authorizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.authorizations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view authorizations" ON public.authorizations
  FOR SELECT USING (true);

CREATE POLICY "Super admins can manage authorizations" ON public.authorizations
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Add authorization_id FK to courses
ALTER TABLE public.courses ADD COLUMN authorization_id UUID REFERENCES public.authorizations(id);

-- Updated_at trigger
CREATE TRIGGER update_authorizations_updated_at
  BEFORE UPDATE ON public.authorizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
