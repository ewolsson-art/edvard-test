-- Add chat_enabled column to patient_doctor_connections
ALTER TABLE public.patient_doctor_connections
ADD COLUMN chat_enabled boolean NOT NULL DEFAULT false;

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.patient_doctor_connections(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

-- Create index for faster queries
CREATE INDEX idx_chat_messages_connection_id ON public.chat_messages(connection_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_messages
-- Patients can view messages in their connections where chat is enabled
CREATE POLICY "Patients can view their chat messages"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_doctor_connections pdc
    WHERE pdc.id = chat_messages.connection_id
    AND pdc.patient_id = auth.uid()
    AND pdc.status = 'approved'
    AND pdc.chat_enabled = true
  )
);

-- Doctors can view messages in their connections
CREATE POLICY "Doctors can view their chat messages"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patient_doctor_connections pdc
    WHERE pdc.id = chat_messages.connection_id
    AND pdc.doctor_id = auth.uid()
    AND pdc.status = 'approved'
  )
);

-- Patients can send messages if chat is enabled
CREATE POLICY "Patients can send messages when chat enabled"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.patient_doctor_connections pdc
    WHERE pdc.id = chat_messages.connection_id
    AND pdc.patient_id = auth.uid()
    AND pdc.status = 'approved'
    AND pdc.chat_enabled = true
  )
);

-- Doctors can always send messages to approved connections
CREATE POLICY "Doctors can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.patient_doctor_connections pdc
    WHERE pdc.id = chat_messages.connection_id
    AND pdc.doctor_id = auth.uid()
    AND pdc.status = 'approved'
  )
);

-- Users can update their own messages (for read receipts)
CREATE POLICY "Users can update messages in their connections"
ON public.chat_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patient_doctor_connections pdc
    WHERE pdc.id = chat_messages.connection_id
    AND (pdc.patient_id = auth.uid() OR pdc.doctor_id = auth.uid())
    AND pdc.status = 'approved'
  )
);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;