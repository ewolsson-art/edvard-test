CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date_desc
  ON public.mood_entries (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_date
  ON public.medication_logs (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_medications_user_active
  ON public.medications (user_id, active);
CREATE INDEX IF NOT EXISTS idx_diagnoses_user
  ON public.diagnoses (user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_status_created
  ON public.community_posts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user
  ON public.community_posts (user_id);
CREATE INDEX IF NOT EXISTS idx_community_reactions_post
  ON public.community_reactions (post_id);
CREATE INDEX IF NOT EXISTS idx_pdc_doctor_status
  ON public.patient_doctor_connections (doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_pdc_patient_status
  ON public.patient_doctor_connections (patient_id, status);
CREATE INDEX IF NOT EXISTS idx_prc_relative_status
  ON public.patient_relative_connections (relative_id, status);
CREATE INDEX IF NOT EXISTS idx_prc_patient_status
  ON public.patient_relative_connections (patient_id, status);
CREATE INDEX IF NOT EXISTS idx_relative_comments_patient_date
  ON public.relative_comments (patient_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_connection_created
  ON public.chat_messages (connection_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_answers_user_date
  ON public.custom_checkin_answers (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_delegates_doctor
  ON public.doctor_delegates (doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_delegates_email
  ON public.doctor_delegates (delegate_email);
