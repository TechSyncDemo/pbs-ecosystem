
ALTER TABLE public.enquiries DROP CONSTRAINT enquiries_source_check;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_source_check CHECK (source = ANY (ARRAY['walk-in'::text, 'phone'::text, 'website'::text, 'referral'::text, 'social-media'::text, 'online'::text, 'newspaper'::text, 'other'::text]));

ALTER TABLE public.enquiries DROP CONSTRAINT enquiries_status_check;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_status_check CHECK (status = ANY (ARRAY['new'::text, 'contacted'::text, 'interested'::text, 'converted'::text, 'lost'::text, 'callback'::text, 'enrolled'::text, 'not_interested'::text]));
