
-- Add link column to tutorials
ALTER TABLE public.tutorials ADD COLUMN IF NOT EXISTS link text;

-- Create junction table for tutorial-authorization many-to-many
CREATE TABLE public.tutorial_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id uuid NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  authorization_id uuid NOT NULL REFERENCES public.authorizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tutorial_id, authorization_id)
);

ALTER TABLE public.tutorial_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tutorial authorizations"
  ON public.tutorial_authorizations FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admins can manage tutorial authorizations"
  ON public.tutorial_authorizations FOR ALL TO public
  USING (has_role(auth.uid(), 'super_admin'));

-- Create storage bucket for tutorial PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('tutorials', 'tutorials', true);

-- Storage policies for tutorial files
CREATE POLICY "Super admins can upload tutorial files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tutorials' AND has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete tutorial files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'tutorials' AND has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone authenticated can view tutorial files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'tutorials');
