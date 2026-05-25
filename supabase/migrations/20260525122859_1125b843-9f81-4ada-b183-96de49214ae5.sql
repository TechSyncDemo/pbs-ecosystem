ALTER TABLE public.centers
  ADD COLUMN IF NOT EXISTS certificate_address text,
  ADD COLUMN IF NOT EXISTS communication_address text;