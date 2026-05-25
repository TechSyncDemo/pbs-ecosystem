-- Allow center admins to update their own center (name and email guarded by trigger)
CREATE POLICY "Center admins can update own center"
ON public.centers
FOR UPDATE
USING (id = public.get_user_center_id(auth.uid()))
WITH CHECK (id = public.get_user_center_id(auth.uid()));

-- Prevent center admins from changing protected fields (name, email, code, status, loyalty_points, loyalty_reset_at, coordinator_id)
CREATE OR REPLACE FUNCTION public.guard_center_protected_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'super_admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.name IS DISTINCT FROM OLD.name
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.code IS DISTINCT FROM OLD.code
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.loyalty_points IS DISTINCT FROM OLD.loyalty_points
     OR NEW.loyalty_reset_at IS DISTINCT FROM OLD.loyalty_reset_at
     OR NEW.coordinator_id IS DISTINCT FROM OLD.coordinator_id THEN
    RAISE EXCEPTION 'Not authorized to change protected center fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_center_protected_fields ON public.centers;
CREATE TRIGGER trg_guard_center_protected_fields
BEFORE UPDATE ON public.centers
FOR EACH ROW
EXECUTE FUNCTION public.guard_center_protected_fields();