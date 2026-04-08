
DROP POLICY "Users can receive notifications" ON public.notifications;

CREATE POLICY "Triggers can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
