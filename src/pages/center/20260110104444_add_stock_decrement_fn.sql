CREATE OR REPLACE FUNCTION public.decrement_stock(p_center_id uuid, p_course_id uuid, p_quantity integer)
RETURNS TABLE(id uuid, center_id uuid, stock_item_id uuid, quantity integer, last_updated timestamptz) AS $$
DECLARE
    v_stock_item_id uuid;
    updated_row public.center_stock%ROWTYPE;
BEGIN
    -- In our system, course_id is the same as stock_item_id for course kits.
    v_stock_item_id := p_course_id;

    UPDATE public.center_stock
    SET quantity = quantity - p_quantity,
        last_updated = now()
    WHERE center_stock.center_id = p_center_id
      AND center_stock.stock_item_id = v_stock_item_id
      AND center_stock.quantity >= p_quantity
    RETURNING * INTO updated_row;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock or item not found for center';
    END IF;

    RETURN QUERY SELECT * FROM public.center_stock WHERE center_stock.id = updated_row.id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, uuid, integer) TO authenticated;