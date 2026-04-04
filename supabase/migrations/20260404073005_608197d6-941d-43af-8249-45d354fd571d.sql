
-- Create or replace the decrement_stock function
CREATE OR REPLACE FUNCTION public.decrement_stock(p_center_id uuid, p_course_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_stock_item_id uuid;
BEGIN
    -- Look up the stock_item_id from stock_items by course_id
    SELECT id INTO v_stock_item_id
    FROM public.stock_items
    WHERE course_id = p_course_id
    LIMIT 1;

    IF v_stock_item_id IS NULL THEN
        RAISE EXCEPTION 'No stock item found for this course';
    END IF;

    UPDATE public.center_stock
    SET quantity = quantity - p_quantity,
        last_updated = now()
    WHERE center_id = p_center_id
      AND stock_item_id = v_stock_item_id
      AND quantity >= p_quantity;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock or item not found for center';
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, uuid, integer) TO authenticated;
