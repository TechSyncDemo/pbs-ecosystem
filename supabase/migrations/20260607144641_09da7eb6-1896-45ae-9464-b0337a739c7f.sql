INSERT INTO public.profiles (id, email, full_name, center_id)
VALUES ('cff2079e-efd7-4d1f-8b07-c434efe913e0', 'excel.info2007@gmail.com', 'Excel Infotech', '94a34ec5-7a53-4713-9c14-f2599fdf37b2')
ON CONFLICT (id) DO UPDATE SET center_id = EXCLUDED.center_id, email = EXCLUDED.email, full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);