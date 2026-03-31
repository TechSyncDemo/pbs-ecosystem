
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS max_marks integer NOT NULL DEFAULT 100;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS passing_marks integer NOT NULL DEFAULT 40;
