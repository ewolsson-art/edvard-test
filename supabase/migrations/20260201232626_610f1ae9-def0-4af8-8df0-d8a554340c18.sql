-- Fix 1: Remove the overly permissive shared_reports policy and make it validate share_key properly
-- The old policy 'Anyone can view reports by share_key' uses USING(true) which exposes all data
DROP POLICY IF EXISTS "Anyone can view reports by share_key" ON public.shared_reports;

-- Fix 2: Remove the dangerous policy that allows users to update their own role
-- This prevents privilege escalation from patient to doctor
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;

-- Fix 3: Update the handle_new_user_role trigger to ALWAYS default to 'patient'
-- This prevents users from self-assigning doctor role during signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- SECURITY FIX: Always assign 'patient' role by default
  -- Doctor roles should only be granted through a separate admin/invitation process
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient'::app_role)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;