-- Update the user creation function to handle empty names better
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user names for existing users without names
CREATE OR REPLACE FUNCTION public.update_user_names()
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET name = split_part(email, '@', 1)
  WHERE name IS NULL OR TRIM(name) = '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to update existing users
SELECT public.update_user_names();
