-- Replace the center-code generator with an atomic, advisory-lock-protected version
-- Format: PBS{StateCode 2}{YYYY 4}{Seq 3}  (e.g. PBSMH2026001) - 12 chars

CREATE OR REPLACE FUNCTION public.generate_center_code(state_code text DEFAULT '00')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year text;
  next_seq int;
  result text;
  safe_state text;
BEGIN
  -- Serialize concurrent generators (advisory lock auto-released at txn end)
  PERFORM pg_advisory_xact_lock(hashtext('generate_center_code'));

  current_year := to_char(now(), 'YYYY');
  safe_state := COALESCE(NULLIF(state_code, ''), '00');
  IF length(safe_state) <> 2 THEN
    safe_state := lpad(left(safe_state, 2), 2, '0');
  END IF;

  -- Highest sequence used this year across ALL states (so codes never collide)
  SELECT COALESCE(MAX(
    CASE
      WHEN length(code) = 12
       AND substring(code from 1 for 3) = 'PBS'
       AND substring(code from 6 for 4) = current_year
       AND substring(code from 10 for 3) ~ '^[0-9]+$'
      THEN CAST(substring(code from 10 for 3) AS integer)
      ELSE 0
    END
  ), 0) + 1
  INTO next_seq
  FROM centers;

  result := 'PBS' || safe_state || current_year || lpad(next_seq::text, 3, '0');

  -- Defensive: if (somehow) it exists, keep incrementing
  WHILE EXISTS (SELECT 1 FROM centers WHERE code = result) LOOP
    next_seq := next_seq + 1;
    result := 'PBS' || safe_state || current_year || lpad(next_seq::text, 3, '0');
  END LOOP;

  RETURN result;
END;
$$;

-- Drop the older no-arg overload to avoid ambiguity
DROP FUNCTION IF EXISTS public.generate_center_code();