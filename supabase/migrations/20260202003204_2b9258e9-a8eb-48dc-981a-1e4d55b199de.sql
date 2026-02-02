-- Add column to track who initiated the connection request
ALTER TABLE public.patient_doctor_connections 
ADD COLUMN initiated_by text NOT NULL DEFAULT 'patient' 
CHECK (initiated_by IN ('patient', 'doctor'));

-- Add RLS policy for doctors to create connection requests
CREATE POLICY "Doctors can request patient access"
ON public.patient_doctor_connections
FOR INSERT
WITH CHECK (
  auth.uid() = doctor_id 
  AND public.has_role(auth.uid(), 'doctor')
);

-- Add policy for doctors to delete their own pending requests
CREATE POLICY "Doctors can delete their pending requests"
ON public.patient_doctor_connections
FOR DELETE
USING (
  auth.uid() = doctor_id 
  AND status = 'pending'
  AND initiated_by = 'doctor'
);