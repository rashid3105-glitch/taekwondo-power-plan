import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, GripVertical, ClipboardList, BarChart3, Loader2, Archive, ArchiveRestore, Bookmark, Share2, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchCoachSurveys, createSurvey, deleteSurvey, fetchSurvey, fetchSurveyResults,
  listTemplates, listArchivedTemplates, saveAsTemplate, archiveTemplate,
  unarchiveTemplate, deleteTemplate, updateTemplate,
  type Survey, type SurveyQuestion, type SurveyQuestionType, type SurveyTargetScope,
  type SurveyTemplate, type TemplateQuestion,
} from "@/lib/surveysApi";

interface DraftQ {
  type: SurveyQuestionType;
  question_text: string;
  required: boolean;
  scale_max: number;
  mc_options: string[];
}

const emptyQ = (type: SurveyQuestionType = "text"): DraftQ => ({
  type, question_text: "", required: false, scale_max: 5, mc_options: [],
});

interface BuilderInitial {
  title?: string;
  description?: string;
  allow_anonymous?: boolean;
  questions?: DraftQ[];
}

function templateToDraft(tpl: SurveyTemplate): BuilderInitial {
  return {
    title: tpl.title,
    description: tpl.description || "",
    allow_anonymous: tpl.allow_anonymous,
    questions: (tpl.questions || []).map((q) => ({
      type: q.type,
      question_text: q.question_text,
      required: q.required,
      scale_max: q.scale_max ?? 5,
      mc_options: q.mc_options ?? [],
    })),
  };
}

export default function CoachSurveys() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [list, setList] = useState<Survey[]>([]);
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [archived, setArchived] = useState<SurveyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderInitial, setBuilderInitial] = useState<BuilderInitial | undefined>();
  const [resultsId, setResultsId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pickTemplateOpen, setPickTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SurveyTemplate | null>(null);
  const [deleteTplId, setDeleteTplId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [s, tpl, arc] = await Promise.all([
        fetchCoachSurveys(), listTemplates(), listArchivedTemplates(),
      ]);
      setList(s); setTemplates(tpl); setArchived(arc);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNewSurvey = (initial?: BuilderInitial) => {
    setBuilderInitial(initial);
    setBuilderOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/coach")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold flex-1">{t("surveysTitle")}</h1>
          <Button size="sm" onClick={() => openNewSurvey()}>
            <Plus className="h-4 w-4 mr-1" />{t("newSurvey")}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active">{t("surveyTabActive")}</TabsTrigger>
            <TabsTrigger value="templates">{t("surveyTabTemplates")}</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : list.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p>{t("surveyNoSurveysCoach")}</p>
              </div>
            ) : (
              list.map((s) => (
                <div key={s.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{s.title}</h3>
                        <Badge variant={s.published_at ? "default" : "outline"} className="shrink-0 text-[10px]">
                          {s.published_at ? t("surveyPublished") : t("surveyDraft")}
                        </Badge>
                        {s.allow_anonymous && (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">{t("surveyAnonymous")}</Badge>
                        )}
                      </div>
                      {s.description && <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setResultsId(s.id)}>
                      <BarChart3 className="h-4 w-4 mr-1" />{t("surveyResults")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeletingId(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="templates">
            <Tabs defaultValue="t-active">
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="t-active">{t("surveyTemplatesActive")}</TabsTrigger>
                <TabsTrigger value="t-archived">{t("surveyTemplatesArchived")}</TabsTrigger>
              </TabsList>

              <TabsContent value="t-active" className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>{t("surveyNoTemplates")}</p>
                  </div>
                ) : (
                  templates.map((tpl) => (
                    <TemplateCard
                      key={tpl.id}
                      tpl={tpl}
                      onUse={() => openNewSurvey(templateToDraft(tpl))}
                      onEdit={() => setEditingTemplate(tpl)}
                      onArchive={async () => {
                        try { await archiveTemplate(tpl.id); toast.success(t("surveyTemplateArchived")); load(); }
                        catch (e: any) { toast.error(e.message); }
                      }}
                      onToggleShare={async (v) => {
                        try { await updateTemplate(tpl.id, { is_shared_with_club: v }); load(); }
                        catch (e: any) { toast.error(e.message); }
                      }}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="t-archived" className="space-y-3">
                <p className="text-xs text-muted-foreground px-1">{t("surveyArchivedNotice")}</p>
                {archived.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Archive className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>{t("surveyNoArchivedTemplates")}</p>
                  </div>
                ) : (
                  archived.map((tpl) => {
                    const archivedAt = tpl.archived_at ? new Date(tpl.archived_at) : null;
                    const daysLeft = archivedAt
                      ? Math.max(0, 90 - Math.floor((Date.now() - archivedAt.getTime()) / 86_400_000))
                      : 90;
                    return (
                      <div key={tpl.id} className="rounded-lg border border-border bg-card/60 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold truncate flex-1">{tpl.title}</h3>
                          <Badge variant="outline" className="text-[10px]">
                            {t("surveyAutoDeletesIn").replace("{n}", String(daysLeft))}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1" onClick={async () => {
                            try { await unarchiveTemplate(tpl.id); toast.success(t("surveyTemplateRestored")); load(); }
                            catch (e: any) { toast.error(e.message); }
                          }}>
                            <ArchiveRestore className="h-4 w-4 mr-1" />{t("surveyUnarchive")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteTplId(tpl.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {builderOpen && (
        <SurveyBuilder
          initial={builderInitial}
          onOpenPickTemplate={() => setPickTemplateOpen(true)}
          onClose={() => setBuilderOpen(false)}
          onSaved={() => { setBuilderOpen(false); setBuilderInitial(undefined); load(); }}
        />
      )}

      {pickTemplateOpen && (
        <PickTemplateDialog
          templates={templates}
          onClose={() => setPickTemplateOpen(false)}
          onPick={(tpl) => {
            setBuilderInitial(templateToDraft(tpl));
            setPickTemplateOpen(false);
          }}
        />
      )}

      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSaved={() => { setEditingTemplate(null); load(); }}
        />
      )}

      {resultsId && (
        <SurveyResultsDialog surveyId={resultsId} onClose={() => setResultsId(null)} />
      )}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("surveyDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("surveyDeleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deletingId) return;
                try { await deleteSurvey(deletingId); toast.success(t("delete")); load(); }
                catch (e: any) { toast.error(e.message); }
                finally { setDeletingId(null); }
              }}
            >{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTplId} onOpenChange={(o) => !o && setDeleteTplId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("surveyDeleteNow")}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTplId) return;
                try { await deleteTemplate(deleteTplId); toast.success(t("surveyTemplateDeleted")); load(); }
                catch (e: any) { toast.error(e.message); }
                finally { setDeleteTplId(null); }
              }}
            >{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TemplateCard({ tpl, onUse, onEdit, onArchive, onToggleShare }: {
  tpl: SurveyTemplate;
  onUse: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onToggleShare: (v: boolean) => void;
}) {
  const { t } = useLanguage();
  const qCount = (tpl.questions || []).length;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold truncate">{tpl.title}</h3>
            {tpl.is_shared_with_club ? (
              <Badge variant="secondary" className="text-[10px]"><Share2 className="h-3 w-3 mr-1" />{t("surveySharedInClub")}</Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]"><Lock className="h-3 w-3 mr-1" />{t("surveyPrivateTemplate")}</Badge>
            )}
            <Badge variant="outline" className="text-[10px]">{qCount} {t("surveyQuestion")}</Badge>
          </div>
          {tpl.description && <p className="text-sm text-muted-foreground line-clamp-2">{tpl.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <Switch checked={tpl.is_shared_with_club} onCheckedChange={onToggleShare} />
        <Label className="text-xs">{t("surveyShareWithClub")}</Label>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={onUse}>{t("surveyUseTemplate")}</Button>
        <Button size="sm" variant="outline" onClick={onEdit}>{t("editAction")}</Button>
        <Button size="sm" variant="ghost" onClick={onArchive}>
          <Archive className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PickTemplateDialog({ templates, onClose, onPick }: {
  templates: SurveyTemplate[];
  onClose: () => void;
  onPick: (tpl: SurveyTemplate) => void;
}) {
  const { t } = useLanguage();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t("surveyStartFromTemplate")}</DialogTitle></DialogHeader>
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t("surveyNoTemplates")}</p>
        ) : (
          <div className="space-y-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onPick(tpl)}
                className="w-full text-left rounded-lg border border-border p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{tpl.title}</span>
                  {tpl.is_shared_with_club && (
                    <Badge variant="secondary" className="text-[10px] ml-auto">{t("surveySharedInClub")}</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{(tpl.questions || []).length} {t("surveyQuestion")}</p>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TemplateEditor({ template, onClose, onSaved }: {
  template: SurveyTemplate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState(template.title);
  const [description, setDescription] = useState(template.description || "");
  const [allowAnon, setAllowAnon] = useState(template.allow_anonymous);
  const [share, setShare] = useState(template.is_shared_with_club);
  const [questions, setQuestions] = useState<DraftQ[]>(
    (template.questions || []).map((q) => ({
      type: q.type,
      question_text: q.question_text,
      required: q.required,
      scale_max: q.scale_max ?? 5,
      mc_options: q.mc_options ?? [],
    })),
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) { toast.error(t("surveyNeedTitle")); return; }
    const valid = questions.filter((q) => q.question_text.trim().length > 0);
    if (valid.length === 0) { toast.error(t("surveyNeedQuestion")); return; }
    setSaving(true);
    try {
      await updateTemplate(template.id, {
        title: title.trim(),
        description: description.trim() || null,
        allow_anonymous: allowAnon,
        is_shared_with_club: share,
        questions: valid.map((q) => ({
          type: q.type,
          question_text: q.question_text.trim(),
          required: q.required,
          scale_max: q.type === "scale" ? q.scale_max : null,
          mc_options: q.type === "mc" ? q.mc_options.filter((o) => o.trim().length > 0) : null,
        })),
      });
      toast.success(t("surveyTemplateSaved"));
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t("editAction")} — {t("surveyTemplates")}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>{t("surveyFormTitle")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>{t("surveyFormDescription")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={2} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="cursor-pointer">{t("surveyAllowAnonymous")}</Label>
            <Switch checked={allowAnon} onCheckedChange={setAllowAnon} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="cursor-pointer">{t("surveyShareWithClub")}</Label>
            <Switch checked={share} onCheckedChange={setShare} />
          </div>
          <QuestionsEditor questions={questions} setQuestions={setQuestions} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t("cancel")}</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuestionsEditor({ questions, setQuestions }: {
  questions: DraftQ[];
  setQuestions: React.Dispatch<React.SetStateAction<DraftQ[]>>;
}) {
  const { t } = useLanguage();
  const updateQ = (i: number, patch: Partial<DraftQ>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const removeQ = (i: number) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-base">{t("surveyQuestion")}</Label>
        <div className="flex gap-1 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ("text")])}>
            <Plus className="h-3 w-3 mr-1" />{t("surveyQTypeText")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ("scale")])}>
            <Plus className="h-3 w-3 mr-1" />{t("surveyQTypeScale")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ("mc")])}>
            <Plus className="h-3 w-3 mr-1" />{t("surveyQTypeMc")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setQuestions((qs) => [...qs, emptyQ("yesno")])}>
            <Plus className="h-3 w-3 mr-1" />{t("surveyQTypeYesno")}
          </Button>
        </div>
      </div>
      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 mt-2 text-muted-foreground shrink-0" />
            <div className="flex-1 space-y-2">
              <Input
                placeholder={t("surveyQuestion")}
                value={q.question_text}
                onChange={(e) => updateQ(i, { question_text: e.target.value })}
                maxLength={500}
              />
              {q.type === "scale" && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs">{t("surveyScaleMax")}</Label>
                  <Select value={String(q.scale_max)} onValueChange={(v) => updateQ(i, { scale_max: Number(v) })}>
                    <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {q.type === "mc" && (
                <Textarea
                  placeholder={t("surveyMcOptions")}
                  rows={3}
                  value={q.mc_options.join("\n")}
                  onChange={(e) => updateQ(i, { mc_options: e.target.value.split("\n") })}
                />
              )}
              <div className="flex items-center gap-2">
                <Switch checked={q.required} onCheckedChange={(c) => updateQ(i, { required: c })} />
                <Label className="text-xs">{t("surveyRequired")}</Label>
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {q.type === "text" ? t("surveyQTypeText")
                    : q.type === "scale" ? t("surveyQTypeScale")
                    : q.type === "mc" ? t("surveyQTypeMc")
                    : t("surveyQTypeYesno")}
                </Badge>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => removeQ(i)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SurveyBuilder({ initial, onClose, onSaved, onOpenPickTemplate }: {
  initial?: BuilderInitial;
  onClose: () => void;
  onSaved: () => void;
  onOpenPickTemplate: () => void;
}) {
  const { t } = useLanguage();
  const { activeClubId } = useActiveClub();
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [allowAnon, setAllowAnon] = useState(initial?.allow_anonymous ?? false);
  const [scope, setScope] = useState<SurveyTargetScope>("club");
  const [deadline, setDeadline] = useState("");
  const [questions, setQuestions] = useState<DraftQ[]>(initial?.questions || [emptyQ("scale")]);
  const [athletes, setAthletes] = useState<{ user_id: string; display_name: string }[]>([]);
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [shareTemplate, setShareTemplate] = useState(true);

  // re-prefill when picker returns a template
  useEffect(() => {
    if (initial) {
      setTitle(initial.title || "");
      setDescription(initial.description || "");
      setAllowAnon(initial.allow_anonymous ?? false);
      setQuestions(initial.questions || [emptyQ("scale")]);
    }
  }, [initial]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("club_id").eq("user_id", user.id).maybeSingle();
      const clubId = activeClubId ?? (profile as any)?.club_id;
      if (!clubId) return;
      const { data } = await supabase.rpc("get_club_member_profiles", { _club_id: clubId });
      const filtered = (data || []).filter((p: any) => p.user_id !== user.id);
      setAthletes(filtered.map((p: any) => ({ user_id: p.user_id, display_name: p.display_name || "" })));
    })();
  }, [activeClubId]);

  const buildTemplateQuestions = (): TemplateQuestion[] => {
    const valid = questions.filter((q) => q.question_text.trim().length > 0);
    return valid.map((q) => ({
      type: q.type,
      question_text: q.question_text.trim(),
      required: q.required,
      scale_max: q.type === "scale" ? q.scale_max : null,
      mc_options: q.type === "mc" ? q.mc_options.filter((o) => o.trim().length > 0) : null,
    }));
  };

  const handleSaveAsTemplate = async () => {
    if (!title.trim()) { toast.error(t("surveyNeedTitle")); return; }
    const tq = buildTemplateQuestions();
    if (tq.length === 0) { toast.error(t("surveyNeedQuestion")); return; }
    setSaving(true);
    try {
      await saveAsTemplate({
        title: title.trim(),
        description: description.trim() || null,
        allow_anonymous: allowAnon,
        questions: tq,
        is_shared_with_club: shareTemplate,
      });
      toast.success(t("surveyTemplateSaved"));
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const save = async (publish: boolean) => {
    if (!title.trim()) { toast.error(t("surveyNeedTitle")); return; }
    const valid = questions.filter((q) => q.question_text.trim().length > 0);
    if (valid.length === 0) { toast.error(t("surveyNeedQuestion")); return; }
    setSaving(true);
    try {
      await createSurvey({
        title: title.trim(),
        description: description.trim() || null,
        allow_anonymous: allowAnon,
        target_scope: scope,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        questions: valid.map((q) => ({
          position: 0,
          type: q.type,
          question_text: q.question_text.trim(),
          required: q.required,
          scale_max: q.type === "scale" ? q.scale_max : null,
          mc_options: q.type === "mc" ? q.mc_options.filter((o) => o.trim().length > 0) : null,
        })) as any,
        recipients: scope === "selected" ? Array.from(selectedAthletes) : [],
        publish,
      });
      toast.success(publish ? t("surveyPublished") : t("surveyDraft"));
      onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("newSurvey")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={onOpenPickTemplate}>
            <FileText className="h-4 w-4 mr-1" />{t("surveyStartFromTemplate")}
          </Button>

          <div>
            <Label>{t("surveyFormTitle")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div>
            <Label>{t("surveyFormDescription")}</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={2} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex-1 pr-3">
              <Label className="cursor-pointer">{t("surveyAllowAnonymous")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t("surveyAllowAnonymousHint")}</p>
            </div>
            <Switch checked={allowAnon} onCheckedChange={setAllowAnon} />
          </div>
          <div>
            <Label>{t("surveyTargetScope")}</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as SurveyTargetScope)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="club">{t("surveyTargetClub")}</SelectItem>
                <SelectItem value="selected">{t("surveyTargetSelected")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {scope === "selected" && (
            <div className="rounded-lg border border-border p-3 max-h-48 overflow-y-auto space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">{t("surveySelectAthletes")}</p>
              {athletes.map((a) => (
                <label key={a.user_id} className="flex items-center gap-2 py-1 cursor-pointer">
                  <Checkbox
                    checked={selectedAthletes.has(a.user_id)}
                    onCheckedChange={(c) => {
                      setSelectedAthletes((s) => {
                        const n = new Set(s);
                        if (c) n.add(a.user_id); else n.delete(a.user_id);
                        return n;
                      });
                    }}
                  />
                  <span className="text-sm">{a.display_name}</span>
                </label>
              ))}
            </div>
          )}
          <div>
            <Label>{t("surveyDeadline")}</Label>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <QuestionsEditor questions={questions} setQuestions={setQuestions} />

          <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-3">
            <div className="flex-1 pr-3">
              <Label className="cursor-pointer">{t("surveyShareWithClub")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{t("surveySaveAsTemplate")}</p>
            </div>
            <Switch checked={shareTemplate} onCheckedChange={setShareTemplate} />
          </div>
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <Button variant="ghost" onClick={handleSaveAsTemplate} disabled={saving}>
            <Bookmark className="h-4 w-4 mr-1" />{t("surveySaveAsTemplate")}
          </Button>
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>{t("surveySaveDraft")}</Button>
          <Button onClick={() => save(true)} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{t("surveyPublish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SurveyResultsDialog({ surveyId, onClose }: { surveyId: string; onClose: () => void }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchSurveyResults>> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([fetchSurvey(surveyId), fetchSurveyResults(surveyId)]);
        setSurvey(s.survey); setQuestions(s.questions); setData(r);
      } catch (e: any) { toast.error(e.message); }
      finally { setLoading(false); }
    })();
  }, [surveyId]);

  const stats = useMemo(() => {
    if (!data) return null;
    const byQ: Record<string, { numbers: number[]; choices: Record<string, number>; bools: { y: number; n: number }; texts: { text: string; anon: boolean; name: string }[] }> = {};
    for (const q of questions) byQ[q.id] = { numbers: [], choices: {}, bools: { y: 0, n: 0 }, texts: [] };
    const respMap = new Map(data.responses.map((r) => [r.id, r]));
    for (const a of data.answers) {
      const bucket = byQ[a.question_id]; if (!bucket) continue;
      if (a.answer_number != null) bucket.numbers.push(Number(a.answer_number));
      if (a.answer_choice) bucket.choices[a.answer_choice] = (bucket.choices[a.answer_choice] || 0) + 1;
      if (a.answer_bool != null) { if (a.answer_bool) bucket.bools.y++; else bucket.bools.n++; }
      if (a.answer_text) {
        const r = respMap.get(a.response_id);
        bucket.texts.push({
          text: a.answer_text,
          anon: !!r?.is_anonymous,
          name: r?.athlete_id ? (data.responder_names[r.athlete_id] || "") : "",
        });
      }
    }
    return byQ;
  }, [data, questions]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{survey?.title || t("surveyResults")}</DialogTitle>
        </DialogHeader>
        {loading || !data ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {data.responses.length} {t("surveyResponsesCount")}
            </div>
            {questions.map((q) => {
              const s = stats?.[q.id];
              return (
                <div key={q.id} className="rounded-lg border border-border p-3">
                  <p className="font-semibold text-sm mb-2">{q.question_text}</p>
                  {q.type === "scale" && s && s.numbers.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t("surveyAverage")}: <span className="font-bold text-foreground">{(s.numbers.reduce((a, b) => a + b, 0) / s.numbers.length).toFixed(1)}</span> / {q.scale_max}</p>
                      <p className="text-xs text-muted-foreground mt-1">n = {s.numbers.length}</p>
                    </div>
                  )}
                  {q.type === "yesno" && s && (
                    <div className="text-sm flex gap-4">
                      <span>{t("surveyYes")}: <strong>{s.bools.y}</strong></span>
                      <span>{t("surveyNo")}: <strong>{s.bools.n}</strong></span>
                    </div>
                  )}
                  {q.type === "mc" && s && (
                    <div className="space-y-1">
                      {Object.entries(s.choices).map(([opt, count]) => (
                        <div key={opt} className="flex justify-between text-sm">
                          <span>{opt}</span><strong>{count}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === "text" && s && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">{t("surveyTextAnswers")}: {s.texts.length}</p>
                      {s.texts.map((a, idx) => (
                        <div key={idx} className="rounded bg-muted/40 p-2 text-sm">
                          <p className="text-[10px] text-muted-foreground mb-0.5">
                            {a.anon ? t("surveyAnonymous") : a.name}
                          </p>
                          <p className="whitespace-pre-wrap">{a.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
