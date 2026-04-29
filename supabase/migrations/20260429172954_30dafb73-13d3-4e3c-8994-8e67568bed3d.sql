REVOKE EXECUTE ON FUNCTION public.notify_on_doctor_connection() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_doctor_connection() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_doctor_connection() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.notify_on_relative_connection() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_relative_connection() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_relative_connection() FROM authenticated;