-- Restore EXECUTE on functions used inside RLS policies.
-- RLS expressions evaluate with the caller's privileges, so authenticated users
-- need EXECUTE on these helpers. They are SECURITY DEFINER with fixed search_path,
-- so granting EXECUTE does not expose internals.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_center_id(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.increment_center_stock(uuid, uuid, integer) TO authenticated;