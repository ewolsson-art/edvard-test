
-- Custom check-in questions defined by users
CREATE TABLE public.custom_checkin_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  answer_type TEXT NOT NULL DEFAULT 'yes_no',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_checkin_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom questions" ON public.custom_checkin_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own custom questions" ON public.custom_checkin_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own custom questions" ON public.custom_checkin_questions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own custom questions" ON public.custom_checkin_questions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Deny public access to custom_checkin_questions" ON public.custom_checkin_questions FOR SELECT USING (false);

-- Answers to custom questions
CREATE TABLE public.custom_checkin_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.custom_checkin_questions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  answer_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id, date)
);

ALTER TABLE public.custom_checkin_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom answers" ON public.custom_checkin_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own custom answers" ON public.custom_checkin_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own custom answers" ON public.custom_checkin_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own custom answers" ON public.custom_checkin_answers FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Deny public access to custom_checkin_answers" ON public.custom_checkin_answers FOR SELECT USING (false);

-- Trigger for updated_at
CREATE TRIGGER update_custom_checkin_questions_updated_at
BEFORE UPDATE ON public.custom_checkin_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
