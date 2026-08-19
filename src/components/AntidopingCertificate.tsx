import { useEffect, useRef, useState } from "react";
import { Award, ExternalLink, Loader2, Trash2, Upload, FileText } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const COURSE_URL = "https://uddannelse.antidoping.dk/login/";
const BUCKET = "antidoping-certificates";

interface CertRow {
  id: string;
  test_date: string;
  file_path: string | null;
  file_name: string | null;
}

export function AntidopingCertificate() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testDate, setTestDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("antidoping_certificates")
      .select("id, test_date, file_path, file_name")
      .order("test_date", { ascending: false });
    setRows((data as CertRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!testDate) {
      toast.error(t("adCertDateRequired") || "Vælg først datoen for testen.");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("no user");

      let filePath: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "pdf";
        filePath = `${uid}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(filePath, file, { upsert: false });
        if (upErr) throw upErr;
      }

      const { error } = await supabase.from("antidoping_certificates").insert({
        user_id: uid,
        test_date: testDate,
        file_path: filePath,
        file_name: file?.name ?? null,
      });
      if (error) throw error;

      // Keep the profile's course date in sync (used by compliance alerts + reports)
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("antidoping_course_date")
          .eq("user_id", uid)
          .maybeSingle();
        const current = (prof as any)?.antidoping_course_date as string | null;
        if (!current || testDate > current) {
          await supabase.functions.invoke("update-my-profile", {
            body: { antidoping_course_date: testDate },
          });
        }
      } catch (syncErr) {
        console.error("profile antidoping sync failed", syncErr);
      }

      toast.success(t("adCertSaved") || "Certifikat gemt");

      setTestDate("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e) {
      console.error(e);
      toast.error(String((e as Error)?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const open = async (row: CertRow) => {
    if (!row.file_path) return;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(row.file_path, 60);
    if (error || !data?.signedUrl) {
      toast.error(String(error?.message || "error"));
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (row: CertRow) => {
    if (row.file_path) await supabase.storage.from(BUCKET).remove([row.file_path]);
    await supabase.from("antidoping_certificates").delete().eq("id", row.id);
    load();
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-[#121212]/80 p-5 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-3">
        <Award className="h-5 w-5" style={{ color: "var(--gold)" }} />
        <h3 className="font-['Sora'] text-sm font-bold uppercase tracking-wide text-white">
          {t("adCertTitle") || "Antidoping-kursus & certifikat"}
        </h3>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-white/55">
        {t("adCertIntro") || "Tag det officielle antidoping e-learning-kursus, indskriv datoen for testen og upload dit certifikat her."}
      </p>

      <a
        href={COURSE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors hover:bg-white/[0.06]"
        style={{ color: "var(--gold)", borderColor: "color-mix(in srgb, var(--gold) 40%, transparent)" }}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {t("adCertOpenCourse") || "Åbn kurset"}
      </a>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/45">
            {t("adCertTestDate") || "Dato for test"}
          </label>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-base text-white outline-none focus:border-white/25"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-white/45">
            {t("adCertFile") || "Certifikat (PDF eller billede)"}
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-11 w-full items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-3 text-sm text-white/70 hover:bg-white/[0.06]"
          >
            <Upload className="h-4 w-4" />
            <span className="truncate">{file ? file.name : t("adCertChooseFile") || "Vælg fil"}</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-black disabled:opacity-50"
          style={{ background: "var(--gold)" }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("adCertSave") || "Gem certifikat"}
        </button>
      </div>

      <div className="mt-5 border-t border-white/5 pt-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-white/40" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-white/35">{t("adCertNone") || "Ingen certifikater registreret endnu."}</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <FileText className="h-4 w-4 shrink-0 text-white/40" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {new Date(r.test_date).toLocaleDateString()}
                  </p>
                  {r.file_name && <p className="truncate text-[11px] text-white/40">{r.file_name}</p>}
                </div>
                {r.file_path && (
                  <button
                    onClick={() => open(r)}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-bold uppercase text-white/70 hover:bg-white/[0.06]"
                  >
                    {t("adCertView") || "Åbn"}
                  </button>
                )}
                <button
                  onClick={() => remove(r)}
                  aria-label={t("adCertDelete") || "Slet"}
                  title={t("adCertDelete") || "Slet"}
                  className="rounded-lg p-1.5 text-white/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
