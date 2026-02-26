
CREATE OR REPLACE FUNCTION generate_center_code(state_code text DEFAULT '00')
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  current_year text;
  next_seq int;
  result text;
BEGIN
  current_year := to_char(now(), 'YYYY');
  
  -- Get the next sequence number globally (across all states)
  SELECT COALESCE(MAX(
    CASE 
      WHEN length(code) = 12 AND substring(code from 1 for 3) = 'PBS' 
           AND substring(code from 6 for 4) = current_year
      THEN CAST(substring(code from 10 for 3) AS integer)
      ELSE 0
    END
  ), 0) + 1 INTO next_seq
  FROM centers;
  
  result := 'PBS' || state_code || current_year || lpad(next_seq::text, 2, '0');
  
  RETURN result;
END;
$$;
