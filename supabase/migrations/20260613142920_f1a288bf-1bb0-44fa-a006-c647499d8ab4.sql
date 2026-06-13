
INSERT INTO public.center_courses (center_id, course_id, status, valid_from, valid_until)
VALUES ('17ce93ed-0c08-4510-b7ff-872e39250fc2', 'e1e591ea-1346-4341-b112-412246503f3f', 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '365 days')
ON CONFLICT (center_id, course_id) DO UPDATE SET status='active', valid_until=EXCLUDED.valid_until;
