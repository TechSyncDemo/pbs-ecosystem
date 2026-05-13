-- Coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  discount_value numeric NOT NULL CHECK (discount_value >= 0),
  max_discount numeric,
  min_order_amount numeric NOT NULL DEFAULT 0,
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  per_center_limit integer,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_coupons_code ON public.coupons (code);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage coupons" ON public.coupons
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated can view active coupons" ON public.coupons
  FOR SELECT TO authenticated USING (status = 'active');

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Uppercase codes
CREATE OR REPLACE FUNCTION public.uppercase_coupon_code()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.code := upper(trim(NEW.code));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coupons_upper
  BEFORE INSERT OR UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.uppercase_coupon_code();

-- Redemptions
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL,
  center_id uuid NOT NULL,
  order_id uuid,
  discount_amount numeric NOT NULL DEFAULT 0,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_redemptions_coupon ON public.coupon_redemptions (coupon_id);
CREATE INDEX idx_redemptions_center ON public.coupon_redemptions (center_id);

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage redemptions" ON public.coupon_redemptions
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Centers view own redemptions" ON public.coupon_redemptions
  FOR SELECT USING (center_id = get_user_center_id(auth.uid()));

CREATE POLICY "Centers insert own redemptions" ON public.coupon_redemptions
  FOR INSERT WITH CHECK (center_id = get_user_center_id(auth.uid()));

-- Order columns
ALTER TABLE public.orders
  ADD COLUMN coupon_id uuid,
  ADD COLUMN coupon_code text,
  ADD COLUMN discount_amount numeric NOT NULL DEFAULT 0;

-- Validate & apply
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _center_id uuid, _order_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons;
  d numeric := 0;
  used_by_center integer;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE code = upper(trim(_code));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid coupon code');
  END IF;
  IF c.status <> 'active' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon is inactive');
  END IF;
  IF c.valid_from > now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon not yet active');
  END IF;
  IF c.valid_until IS NOT NULL AND c.valid_until < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon has expired');
  END IF;
  IF c.usage_limit IS NOT NULL AND c.usage_count >= c.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Coupon usage limit reached');
  END IF;
  IF _order_amount < c.min_order_amount THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Minimum order amount not met');
  END IF;
  IF c.per_center_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO used_by_center FROM public.coupon_redemptions
      WHERE coupon_id = c.id AND center_id = _center_id;
    IF used_by_center >= c.per_center_limit THEN
      RETURN jsonb_build_object('valid', false, 'error', 'You have already used this coupon');
    END IF;
  END IF;

  IF c.discount_type = 'percentage' THEN
    d := round(_order_amount * c.discount_value / 100, 2);
    IF c.max_discount IS NOT NULL AND d > c.max_discount THEN
      d := c.max_discount;
    END IF;
  ELSE
    d := c.discount_value;
  END IF;
  IF d > _order_amount THEN d := _order_amount; END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', c.id,
    'code', c.code,
    'discount_amount', d,
    'discount_type', c.discount_type,
    'discount_value', c.discount_value
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_coupon_to_order(_code text, _center_id uuid, _order_id uuid, _order_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v jsonb;
  cid uuid;
  d numeric;
BEGIN
  v := public.validate_coupon(_code, _center_id, _order_amount);
  IF NOT (v->>'valid')::boolean THEN
    RETURN v;
  END IF;
  cid := (v->>'coupon_id')::uuid;
  d := (v->>'discount_amount')::numeric;

  UPDATE public.coupons SET usage_count = usage_count + 1, updated_at = now() WHERE id = cid;
  INSERT INTO public.coupon_redemptions (coupon_id, center_id, order_id, discount_amount)
    VALUES (cid, _center_id, _order_id, d);
  UPDATE public.orders SET coupon_id = cid, coupon_code = v->>'code', discount_amount = d
    WHERE id = _order_id;

  RETURN v;
END;
$$;