-- Enable realtime for connection tables so notification badges update automatically
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_doctor_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patient_relative_connections;