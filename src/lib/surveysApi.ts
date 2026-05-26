import { supabase } from "@/integrations/supabase/client";

export type SurveyQuestionType = "text" | "scale" | "mc" | "yesno";
export type SurveyTargetScope = "club" | "selected";

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  position: number;
  type: SurveyQuestionType;
  question_text: string;
  required: boolean;
  scale_max: number | null;
  mc_options: string[] | null;
}

export interface Survey {
  id: string;
  coach_id: string;
  club_id: string | null;
  title: string;
  description: string | null;
  allow_anonymous: boolean;
  target_scope: SurveyTargetScope;
  deadline: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyAnswerInput {
  question_id: string;
  answer_text?: string | null;
  answer_number?: number | null;
  answer_choice?: string | null;
  answer_bool?: boolean | null;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  athlete_id: string | null;
  is_anonymous: boolean;
  submitted_at: string;
}

export interface SurveyAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string | null;
  answer_number: number | null;
  answer_choice: string | null;
  answer_bool: boolean | null;
}

export async function fetchCoachSurveys(): Promise<Survey[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("surveys")
    .select("*")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Survey[];
}

export async function fetchAthleteSurveys(): Promise<{ survey: Survey; submitted: boolean }[]> {
  // RLS filters to surveys targeted at the athlete.
  const { data: surveys, error } = await supabase
    .from("surveys")
    .select("*")
    .not("published_at", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const list = (surveys || []) as Survey[];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return list.map((s) => ({ survey: s, submitted: false }));
  const ids = list.map((s) => s.id);
  if (ids.length === 0) return [];
  const { data: responses } = await supabase
    .from("survey_responses")
    .select("survey_id,athlete_id,is_anonymous")
    .in("survey_id", ids);
  const { data: anonHist } = await supabase
    .from("survey_anonymous_history")
    .select("survey_id");
  const submittedSet = new Set<string>();
  for (const r of (responses || [])) if ((r as any).athlete_id === user.id) submittedSet.add((r as any).survey_id);
  for (const h of (anonHist || [])) submittedSet.add((h as any).survey_id);
  return list.map((s) => ({ survey: s, submitted: submittedSet.has(s.id) }));
}

export async function fetchSurvey(id: string): Promise<{ survey: Survey; questions: SurveyQuestion[] }> {
  const [{ data: s, error: e1 }, { data: q, error: e2 }] = await Promise.all([
    supabase.from("surveys").select("*").eq("id", id).maybeSingle(),
    supabase.from("survey_questions").select("*").eq("survey_id", id).order("position"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { survey: s as Survey, questions: (q || []) as any };
}

export async function createSurvey(input: {
  title: string;
  description: string | null;
  allow_anonymous: boolean;
  target_scope: SurveyTargetScope;
  deadline: string | null;
  questions: Omit<SurveyQuestion, "id" | "survey_id">[];
  recipients: string[];
  publish: boolean;
}): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("not_authenticated");
  const { data: profile } = await supabase
    .from("profiles")
    .select("club_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const club_id = (profile as any)?.club_id ?? null;

  const { data: survey, error } = await supabase
    .from("surveys")
    .insert({
      coach_id: user.id,
      club_id,
      title: input.title,
      description: input.description,
      allow_anonymous: input.allow_anonymous,
      target_scope: input.target_scope,
      deadline: input.deadline,
      published_at: input.publish ? new Date().toISOString() : null,
    } as any)
    .select()
    .single();
  if (error) throw error;
  const sid = (survey as any).id;

  if (input.questions.length > 0) {
    const { error: qe } = await supabase
      .from("survey_questions")
      .insert(
        input.questions.map((q, i) => ({
          survey_id: sid,
          position: i,
          type: q.type,
          question_text: q.question_text,
          required: q.required,
          scale_max: q.scale_max,
          mc_options: q.mc_options,
        })) as any,
      );
    if (qe) throw qe;
  }
  if (input.target_scope === "selected" && input.recipients.length > 0) {
    const { error: re } = await supabase
      .from("survey_recipients")
      .insert(input.recipients.map((athlete_id) => ({ survey_id: sid, athlete_id })) as any);
    if (re) throw re;
  }
  return sid;
}

export async function deleteSurvey(id: string): Promise<void> {
  const { error } = await supabase.from("surveys").delete().eq("id", id);
  if (error) throw error;
}

export async function submitSurvey(survey_id: string, is_anonymous: boolean, answers: SurveyAnswerInput[]): Promise<string> {
  const { data, error } = await (supabase.rpc as any)("submit_survey", {
    _survey_id: survey_id,
    _is_anonymous: is_anonymous,
    _answers: answers,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchSurveyResults(survey_id: string): Promise<{
  responses: SurveyResponse[];
  answers: SurveyAnswer[];
  recipients: { athlete_id: string }[];
  responder_names: Record<string, string>;
}> {
  const [{ data: responses }, { data: recipients }] = await Promise.all([
    supabase.from("survey_responses").select("*").eq("survey_id", survey_id).order("submitted_at", { ascending: false }),
    supabase.from("survey_recipients").select("athlete_id").eq("survey_id", survey_id),
  ]);
  const responseIds = (responses || []).map((r: any) => r.id);
  let answers: SurveyAnswer[] = [];
  if (responseIds.length > 0) {
    const { data: a } = await supabase.from("survey_answers").select("*").in("response_id", responseIds);
    answers = (a || []) as any;
  }
  const athleteIds = Array.from(new Set((responses || []).map((r: any) => r.athlete_id).filter(Boolean)));
  let responder_names: Record<string, string> = {};
  if (athleteIds.length > 0) {
    const { data: profs } = await supabase.from("profiles").select("user_id,display_name").in("user_id", athleteIds);
    for (const p of (profs || [])) responder_names[(p as any).user_id] = (p as any).display_name || "";
  }
  return {
    responses: (responses || []) as any,
    answers,
    recipients: (recipients || []) as any,
    responder_names,
  };
}
