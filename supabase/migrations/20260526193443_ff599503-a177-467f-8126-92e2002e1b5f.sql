
-- Survey question type enum
CREATE TYPE public.survey_question_type AS ENUM ('text', 'scale', 'mc', 'yesno');
CREATE TYPE public.survey_target_scope AS ENUM ('club', 'selected');

-- Surveys table
CREATE TABLE public.surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  club_id uuid,
  title text NOT NULL,
  description text,
  allow_anonymous boolean NOT NULL DEFAULT false,
  target_scope public.survey_target_scope NOT NULL DEFAULT 'club',
  deadline timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surveys TO authenticated;
GRANT ALL ON public.surveys TO service_role;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_surveys_coach ON public.surveys(coach_id);
CREATE INDEX idx_surveys_club ON public.surveys(club_id);

-- Questions
CREATE TABLE public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  type public.survey_question_type NOT NULL,
  question_text text NOT NULL,
  required boolean NOT NULL DEFAULT false,
  scale_max integer,
  mc_options jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_questions TO authenticated;
GRANT ALL ON public.survey_questions TO service_role;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_survey_questions_survey ON public.survey_questions(survey_id, position);

-- Recipients (for 'selected' scope)
CREATE TABLE public.survey_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(survey_id, athlete_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_recipients TO authenticated;
GRANT ALL ON public.survey_recipients TO service_role;
ALTER TABLE public.survey_recipients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_survey_recipients_athlete ON public.survey_recipients(athlete_id);

-- Responses (athlete_id NULL = anonymous)
CREATE TABLE public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  athlete_id uuid,
  is_anonymous boolean NOT NULL DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_responses TO authenticated;
GRANT ALL ON public.survey_responses TO service_role;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_survey_responses_survey ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_athlete ON public.survey_responses(athlete_id);

-- Answers
CREATE TABLE public.survey_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  answer_text text,
  answer_number numeric,
  answer_choice text,
  answer_bool boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.survey_answers TO authenticated;
GRANT ALL ON public.survey_answers TO service_role;
ALTER TABLE public.survey_answers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_survey_answers_response ON public.survey_answers(response_id);

-- Private anonymous history (athlete -> their own response, coach has no access)
CREATE TABLE public.survey_anonymous_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL,
  response_id uuid NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  survey_id uuid NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(response_id)
);
GRANT SELECT, INSERT, DELETE ON public.survey_anonymous_history TO authenticated;
GRANT ALL ON public.survey_anonymous_history TO service_role;
ALTER TABLE public.survey_anonymous_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_survey_anon_hist_athlete ON public.survey_anonymous_history(athlete_id);

-- ============ Helper functions ============

-- Is the user a target of this survey?
CREATE OR REPLACE FUNCTION public.is_survey_target(_survey_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.surveys s
    WHERE s.id = _survey_id
      AND s.published_at IS NOT NULL
      AND (
        (s.target_scope = 'club' AND s.club_id IS NOT NULL
          AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = _user_id AND p.club_id = s.club_id))
        OR
        (s.target_scope = 'selected'
          AND EXISTS (SELECT 1 FROM public.survey_recipients r WHERE r.survey_id = _survey_id AND r.athlete_id = _user_id))
      )
  )
$$;

-- ============ RLS POLICIES ============

-- surveys
CREATE POLICY "Coaches manage own surveys" ON public.surveys
  FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Athletes view targeted surveys" ON public.surveys
  FOR SELECT TO authenticated
  USING (
    published_at IS NOT NULL AND (
      (target_scope = 'club' AND club_id IS NOT NULL
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.club_id = surveys.club_id))
      OR
      (target_scope = 'selected'
        AND EXISTS (SELECT 1 FROM public.survey_recipients r WHERE r.survey_id = surveys.id AND r.athlete_id = auth.uid()))
    )
  );

-- survey_questions
CREATE POLICY "Coaches manage own survey questions" ON public.survey_questions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_questions.survey_id AND s.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_questions.survey_id AND s.coach_id = auth.uid()));

CREATE POLICY "Athletes view questions of targeted surveys" ON public.survey_questions
  FOR SELECT TO authenticated
  USING (public.is_survey_target(survey_id, auth.uid()));

-- survey_recipients
CREATE POLICY "Coaches manage own recipients" ON public.survey_recipients
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_recipients.survey_id AND s.coach_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_recipients.survey_id AND s.coach_id = auth.uid()));

CREATE POLICY "Athletes see own recipient row" ON public.survey_recipients
  FOR SELECT TO authenticated
  USING (athlete_id = auth.uid());

-- survey_responses
CREATE POLICY "Athletes insert own responses" ON public.survey_responses
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_survey_target(survey_id, auth.uid())
    AND (
      (is_anonymous = false AND athlete_id = auth.uid())
      OR (is_anonymous = true AND athlete_id IS NULL
          AND EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_id AND s.allow_anonymous = true))
    )
  );

CREATE POLICY "Athletes view own non-anonymous responses" ON public.survey_responses
  FOR SELECT TO authenticated
  USING (athlete_id = auth.uid());

CREATE POLICY "Athletes view own anonymous responses via history" ON public.survey_responses
  FOR SELECT TO authenticated
  USING (
    is_anonymous = true
    AND EXISTS (SELECT 1 FROM public.survey_anonymous_history h
                WHERE h.response_id = survey_responses.id AND h.athlete_id = auth.uid())
  );

CREATE POLICY "Coaches view responses to own surveys" ON public.survey_responses
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_responses.survey_id AND s.coach_id = auth.uid()));

-- survey_answers
CREATE POLICY "Athletes insert own answers" ON public.survey_answers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.survey_responses r
      WHERE r.id = survey_answers.response_id
        AND (
          r.athlete_id = auth.uid()
          OR (r.is_anonymous = true
              AND EXISTS (SELECT 1 FROM public.survey_anonymous_history h
                          WHERE h.response_id = r.id AND h.athlete_id = auth.uid()))
        )
    )
  );

CREATE POLICY "Athletes view own answers" ON public.survey_answers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.survey_responses r
      WHERE r.id = survey_answers.response_id
        AND (
          r.athlete_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.survey_anonymous_history h
                     WHERE h.response_id = r.id AND h.athlete_id = auth.uid())
        )
    )
  );

CREATE POLICY "Coaches view answers to own surveys" ON public.survey_answers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.survey_responses r
      JOIN public.surveys s ON s.id = r.survey_id
      WHERE r.id = survey_answers.response_id AND s.coach_id = auth.uid()
    )
  );

-- survey_anonymous_history — STRICTLY athlete-only (coaches NEVER see this)
CREATE POLICY "Athletes manage own anonymous history" ON public.survey_anonymous_history
  FOR ALL TO authenticated
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

-- Auto-update updated_at on surveys
CREATE TRIGGER trg_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Submit-survey RPC: creates response + answers + anonymous history atomically
CREATE OR REPLACE FUNCTION public.submit_survey(
  _survey_id uuid,
  _is_anonymous boolean,
  _answers jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_response_id uuid;
  v_survey public.surveys;
  v_ans jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  SELECT * INTO v_survey FROM public.surveys WHERE id = _survey_id;
  IF v_survey.id IS NULL OR v_survey.published_at IS NULL THEN
    RAISE EXCEPTION 'survey_not_found';
  END IF;
  IF NOT public.is_survey_target(_survey_id, v_uid) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF _is_anonymous AND NOT v_survey.allow_anonymous THEN
    RAISE EXCEPTION 'anonymous_not_allowed';
  END IF;

  INSERT INTO public.survey_responses (survey_id, athlete_id, is_anonymous)
  VALUES (_survey_id, CASE WHEN _is_anonymous THEN NULL ELSE v_uid END, _is_anonymous)
  RETURNING id INTO v_response_id;

  IF _is_anonymous THEN
    INSERT INTO public.survey_anonymous_history (athlete_id, response_id, survey_id)
    VALUES (v_uid, v_response_id, _survey_id);
  END IF;

  FOR v_ans IN SELECT * FROM jsonb_array_elements(_answers) LOOP
    INSERT INTO public.survey_answers (
      response_id, question_id,
      answer_text, answer_number, answer_choice, answer_bool
    ) VALUES (
      v_response_id,
      (v_ans->>'question_id')::uuid,
      v_ans->>'answer_text',
      CASE WHEN v_ans ? 'answer_number' AND v_ans->>'answer_number' IS NOT NULL
           THEN (v_ans->>'answer_number')::numeric ELSE NULL END,
      v_ans->>'answer_choice',
      CASE WHEN v_ans ? 'answer_bool' AND v_ans->>'answer_bool' IS NOT NULL
           THEN (v_ans->>'answer_bool')::boolean ELSE NULL END
    );
  END LOOP;

  RETURN v_response_id;
END;
$$;
