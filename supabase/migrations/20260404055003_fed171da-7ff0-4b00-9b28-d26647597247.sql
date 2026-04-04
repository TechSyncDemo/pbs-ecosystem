
DROP FUNCTION IF EXISTS public.increment_center_stock(uuid, uuid, integer);
CREATE OR REPLACE FUNCTION public.increment_center_stock(p_center_id uuid, p_stock_item_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.center_stock (center_id, stock_item_id, quantity, last_updated)
  VALUES (p_center_id, p_stock_item_id, p_quantity, now())
  ON CONFLICT (center_id, stock_item_id)
  DO UPDATE SET
    quantity = center_stock.quantity + p_quantity,
    last_updated = now();
END;
$$;
