CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $new_user$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', 'empleado', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$new_user$;
