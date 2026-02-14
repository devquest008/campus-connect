
-- Drop the recursive SELECT policy
DROP POLICY IF EXISTS "Users can view same-campus profiles" ON public.profiles;

-- Recreate using the security definer function to avoid recursion
CREATE POLICY "Users can view same-campus profiles"
ON public.profiles
FOR SELECT
USING (
  campus_id = public.get_user_campus_id(auth.uid())
  OR cross_campus_visible = true
  OR user_id = auth.uid()
);
