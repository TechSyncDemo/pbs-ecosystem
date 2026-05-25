
-- 1. Harden get_user_center_id with explicit NULL guard
CREATE OR REPLACE FUNCTION public.get_user_center_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT center_id FROM public.profiles
  WHERE id = _user_id AND center_id IS NOT NULL
$$;

-- 2. Coordinators: restrict SELECT to super admins only
DROP POLICY IF EXISTS "Authenticated users can view coordinators" ON public.coordinators;
CREATE POLICY "Super admins can view coordinators"
  ON public.coordinators FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- 3. Coupons: restrict SELECT to super admins and center admins
DROP POLICY IF EXISTS "Authenticated can view active coupons" ON public.coupons;
CREATE POLICY "Center admins and super admins view active coupons"
  ON public.coupons FOR SELECT
  USING (
    status = 'active'
    AND (
      public.has_role(auth.uid(), 'super_admin')
      OR public.get_user_center_id(auth.uid()) IS NOT NULL
    )
  );

-- 4. Revoke EXECUTE on internal helper / trigger functions from public, anon, authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_center_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_create_stock_item_for_course() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_center_protected_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.uppercase_coupon_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_loyalty_points_on_admission() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_order_no() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_center_stock(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;

-- 5. Tutorials bucket: remove broad listing policy (public URLs still serve files directly)
DROP POLICY IF EXISTS "Anyone authenticated can view tutorial files" ON storage.objects;
