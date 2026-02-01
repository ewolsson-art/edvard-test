-- Create table for doctor delegates (assistants/nurses)
CREATE TABLE public.doctor_delegates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  delegate_email TEXT NOT NULL,
  delegate_id UUID,
  delegate_name TEXT,
  can_read_messages BOOLEAN NOT NULL DEFAULT true,
  can_send_messages BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, delegate_email)
);

-- Enable RLS
ALTER TABLE public.doctor_delegates ENABLE ROW LEVEL SECURITY;

-- Doctors can manage their own delegates
CREATE POLICY "Doctors can view their delegates"
ON public.doctor_delegates
FOR SELECT
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can create delegates"
ON public.doctor_delegates
FOR INSERT
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their delegates"
ON public.doctor_delegates
FOR UPDATE
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their delegates"
ON public.doctor_delegates
FOR DELETE
USING (auth.uid() = doctor_id);

-- Delegates can view their own delegate records
CREATE POLICY "Delegates can view their assignments"
ON public.doctor_delegates
FOR SELECT
USING (auth.uid() = delegate_id AND status = 'approved');

-- Allow delegates to view chat messages for their assigned doctors' patients
CREATE POLICY "Delegates can view chat messages"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM doctor_delegates dd
    JOIN patient_doctor_connections pdc ON pdc.doctor_id = dd.doctor_id
    WHERE dd.delegate_id = auth.uid()
    AND dd.status = 'approved'
    AND dd.can_read_messages = true
    AND pdc.id = chat_messages.connection_id
    AND pdc.status = 'approved'
  )
);

-- Allow delegates to send messages on behalf of doctors
CREATE POLICY "Delegates can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM doctor_delegates dd
    JOIN patient_doctor_connections pdc ON pdc.doctor_id = dd.doctor_id
    WHERE dd.delegate_id = auth.uid()
    AND dd.status = 'approved'
    AND dd.can_send_messages = true
    AND pdc.id = connection_id
    AND pdc.status = 'approved'
  )
  AND auth.uid() = sender_id
);

-- Function to link delegate when they create an account
CREATE OR REPLACE FUNCTION public.link_delegate_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.doctor_delegates
  SET delegate_id = NEW.id, status = 'approved', updated_at = now()
  WHERE delegate_email = NEW.email AND delegate_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-link delegates
CREATE TRIGGER on_auth_user_created_link_delegate
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.link_delegate_on_signup();

-- Add trigger for updated_at
CREATE TRIGGER update_doctor_delegates_updated_at
BEFORE UPDATE ON public.doctor_delegates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();