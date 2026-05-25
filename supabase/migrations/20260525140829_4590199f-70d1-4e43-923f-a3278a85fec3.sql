CREATE OR REPLACE FUNCTION public.guard_center_protected_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(), 'super_admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.name IS DISTINCT FROM OLD.name
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.code IS DISTINCT FROM OLD.code
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.coordinator_id IS DISTINCT FROM OLD.coordinator_id THEN
    RAISE EXCEPTION 'Not authorized to change protected center fields';
  END IF;
  RETURN NEW;
END;
$function$;