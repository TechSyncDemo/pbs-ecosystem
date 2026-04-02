
-- Fix coordinator PII exposure: restrict to authenticated users only
DROP POLICY IF EXISTS "Center admins can view coordinators" ON public.coordinators;
CREATE POLICY "Authenticated users can view coordinators"
  ON public.coordinators FOR SELECT
  TO authenticated
  USING (true);

-- Fix app_settings: restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can view settings" ON public.app_settings;
CREATE POLICY "Authenticated users can view settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Fix course_topics: restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can view course topics" ON public.course_topics;
CREATE POLICY "Authenticated users can view course topics"
  ON public.course_topics FOR SELECT
  TO authenticated
  USING (true);

-- Fix tutorials: restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can view tutorials" ON public.tutorials;
CREATE POLICY "Authenticated users can view tutorials"
  ON public.tutorials FOR SELECT
  TO authenticated
  USING (true);

-- Fix authorizations: restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can view authorizations" ON public.authorizations;
CREATE POLICY "Authenticated users can view authorizations"
  ON public.authorizations FOR SELECT
  TO authenticated
  USING (true);
