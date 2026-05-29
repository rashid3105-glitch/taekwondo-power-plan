import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Save, Loader2, Camera, User as UserIcon } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { toast } from "sonner";

const cardCls = "rounded-xl bg-white/[0.03] border border-white/10 p-5 sm:p-6";
const sectionTitleCls = "text-xs uppercase tracking-wider text-white/35 mb-4";
const inputCls = "bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20";

const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif"];

interface LicenseField { id: string; field_name: string; sort_order: number; }
interface LicenseValue { value?: string | null; expires_at?: string | null; }

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string>("");
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [beltLevel, setBeltLevel] = useState("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [discipline, setDiscipline] = useState("sparring");
  const [goalsText, setGoalsText] = useState("");

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isCoach, setIsCoach] = useState(false);
  const [licenseFieldsOwnerId, setLicenseFieldsOwnerId] = useState<string | null>(null);
  const [licenseFields, setLicenseFields] = useState<LicenseField[]>([]);
  const [licenseValues, setLicenseValues] = useState<Record<string, LicenseValue>>({});
  const [newFieldName, setNewFieldName] = useState("");

  const signedExisting = useAvatarUrl(avatarUrl);
  const displayedAvatar = pendingPreview || signedExisting;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, birth_date, belt_level, weight_kg, discipline, goals, avatar_url, roles, license_values")
        .eq("user_id", user.id)
        .maybeSingle();
      if (p) {
        setDisplayName(p.display_name ?? "");
        setBirthDate(p.birth_date ?? "");
        setBeltLevel(p.belt_level ?? "");
        setWeightKg(p.weight_kg != null ? String(p.weight_kg) : "");
        setDiscipline(p.discipline ?? "sparring");
        setGoalsText(Array.isArray(p.goals) ? p.goals.join(", ") : "");
        setAvatarUrl(p.avatar_url ?? null);
        setLicenseValues(((p as any).license_values ?? {}) as Record<string, LicenseValue>);
      }

      const roles: string[] = (p as any)?.roles ?? [];
      const userIsCoach = roles.includes("coach");
      setIsCoach(userIsCoach);

      const { data: ca } = await supabase
        .from("coach_athletes")
        .select("coach_id")
        .eq("athlete_id", user.id)
        .limit(1)
        .maybeSingle();
      const ownerId = ca?.coach_id ?? (userIsCoach ? user.id : null);
      setLicenseFieldsOwnerId(ownerId);

      if (ownerId) {
        const { data: lf } = await supabase
          .from("coach_license_fields")
          .select("id, field_name, sort_order")
          .eq("coach_id", ownerId)
          .order("sort_order", { ascending: true });
        setLicenseFields((lf ?? []) as LicenseField[]);
      }

      setLoading(false);
    })();
  }, [navigate]);


  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      toast.error("Kun JPG, PNG, WEBP eller GIF er tilladt");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Billedet er for stort — maks 10 MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    // Auto-downscale large images (most phone photos are >2000px) to stay
    // within the server-side limit instead of rejecting them.
    let processed: Blob = file;
    try {
      const bmp = await createImageBitmap(file);
      const MAX = 1600;
      if (bmp.width > MAX || bmp.height > MAX) {
        const scale = Math.min(MAX / bmp.width, MAX / bmp.height);
        const w = Math.round(bmp.width * scale);
        const h = Math.round(bmp.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(bmp, 0, 0, w, h);
          const blob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9),
          );
          if (blob) processed = blob;
        }
      }
      bmp.close?.();
    } catch {
      // ignore — fall back to original file
    }

    const safeName = ext === "jpeg" ? "avatar.jpg" : `avatar.${ext}`;
    const safeType = processed.type || file.type || "image/jpeg";
    const resized = processed instanceof File
      ? processed
      : new File([processed], safeName, { type: safeType });

    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(resized);
    setPendingPreview(URL.createObjectURL(resized));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadAvatarIfNeeded = async (): Promise<string | null> => {
    if (!pendingFile || !userId) return null;
    const rawExt = (pendingFile.name.split(".").pop() || "jpg").toLowerCase();
    const ext = rawExt === "jpeg" ? "jpg" : rawExt;
    const path = `${userId}/avatar.${ext}`;
    const contentType = pendingFile.type || `image/${ext === "jpg" ? "jpeg" : ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, pendingFile, { upsert: true, contentType });
    if (error) {
      console.error("Avatar upload failed:", error);
      throw new Error(`Billede kunne ikke uploades: ${error.message}`);
    }
    return path;
  };

  const handleSave = async (): Promise<boolean> => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      let newAvatarPath: string | null = null;
      if (pendingFile) {
        newAvatarPath = await uploadAvatarIfNeeded();
      }

      const goals = goalsText.split(",").map((g) => g.trim()).filter(Boolean);
      const weight = weightKg ? parseFloat(weightKg) : null;

      // Clean license values: only persist entries for known fields, drop empties.
      const cleanedLicenseValues: Record<string, LicenseValue> = {};
      for (const f of licenseFields) {
        const v = licenseValues[f.id];
        if (!v) continue;
        const val = (v.value ?? "").trim();
        const exp = v.expires_at && /^\d{4}-\d{2}-\d{2}$/.test(v.expires_at) ? v.expires_at : null;
        if (val || exp) {
          cleanedLicenseValues[f.id] = { value: val || null, expires_at: exp };
        }
      }

      const body: Record<string, unknown> = {
        display_name: displayName || null,
        birth_date: birthDate || null,
        belt_level: beltLevel || null,
        weight_kg: weight,
        discipline,
        goals,
        license_values: cleanedLicenseValues,
      };
      if (newAvatarPath) body.avatar_url = newAvatarPath;


      const { error } = await supabase.functions.invoke("update-my-profile", { body });
      if (error) throw error;

      if (newAvatarPath) {
        setAvatarUrl(newAvatarPath);
        setPendingFile(null);
        if (pendingPreview) URL.revokeObjectURL(pendingPreview);
        setPendingPreview(null);
      }
      return true;
    } catch (e: any) {
      toast.error(e?.message || "Fejl");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    const ok = await handleSave();
    if (ok) navigate("/dashboard");
  };

  const handleSaveClick = async () => {
    const ok = await handleSave();
    if (ok) toast.success("Profil gemt");
  };

  const updateLicenseValue = (fieldId: string, patch: Partial<LicenseValue>) => {
    setLicenseValues((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], ...patch } }));
  };

  const addLicenseField = async () => {
    if (!isCoach || !userId) return;
    const name = newFieldName.trim();
    if (!name) return;
    if (licenseFields.length >= 3) {
      toast.error("Maks 3 felter");
      return;
    }
    const sort_order = licenseFields.length;
    const { data, error } = await supabase
      .from("coach_license_fields")
      .insert({ coach_id: userId, field_name: name, sort_order } as any)
      .select("id, field_name, sort_order")
      .single();
    if (error || !data) {
      toast.error("Kunne ikke tilføje felt");
      return;
    }
    setLicenseFields((arr) => [...arr, data as LicenseField]);
    setNewFieldName("");
  };

  const removeLicenseField = async (id: string) => {
    if (!isCoach) return;
    const prev = licenseFields;
    setLicenseFields((arr) => arr.filter((f) => f.id !== id));
    setLicenseValues((vals) => {
      const next = { ...vals };
      delete next[id];
      return next;
    });
    const { error } = await supabase.from("coach_license_fields").delete().eq("id", id);
    if (error) {
      toast.error("Kunne ikke slette");
      setLicenseFields(prev);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white" style={{ backgroundColor: "#0a0a0a" }}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#0a0a0a" }}>
      <PageMeta title={`${t("profileEdit" as any)} · Sportstalent`} description="Edit profile" noindex />
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={saving}
            className="-ml-2 text-white/70 hover:text-white hover:bg-white/5"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t("profileBack" as any)}
          </Button>
          <Button
            size="sm"
            onClick={handleSaveClick}
            disabled={saving}
            className="text-black font-medium"
            style={{ backgroundColor: "var(--accent-hex)" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {t("save" as any) || "Gem"}
          </Button>
        </div>

        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileTitle" as any)}</h2>

          <div className="flex justify-center mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handlePickFile}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              aria-label="Skift profilbillede"
            >
              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-white/15 bg-white/[0.04] flex items-center justify-center">
                {displayedAvatar ? (
                  <img src={displayedAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-10 w-10 text-white/40" />
                )}
              </div>
              <span
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full flex items-center justify-center border-2 border-[#0a0a0a]"
                style={{ backgroundColor: "var(--accent-hex)" }}
              >
                <Camera className="h-4 w-4 text-black" />
              </span>
            </button>
          </div>

          <div className="space-y-4">
            <Field label={t("profileNoName" as any) || "Navn"}>
              <Input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("profileBirthDate" as any)}>
                <Input type="date" className={inputCls} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </Field>
              <Field label={t("profileBeltLevel" as any)}>
                <Input className={inputCls} value={beltLevel} onChange={(e) => setBeltLevel(e.target.value)} placeholder="e.g. 1. dan" />
              </Field>
              <Field label={t("profileWeight" as any)}>
                <Input
                  type="number"
                  inputMode="decimal"
                  className={inputCls}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="kg"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileSportDiscipline" as any)}</h2>
          <div className="space-y-4">
            <Field label={t("profileSport" as any)}>
              <Input className={inputCls} value="Taekwondo" disabled />
            </Field>

            <Field label={t("profileDiscipline" as any)}>
              <div className="flex gap-2">
                {["sparring", "poomsae"].map((d) => {
                  const active = discipline === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiscipline(d)}
                      className="capitalize px-3 py-2 rounded-md text-sm font-medium"
                      style={
                        active
                          ? { backgroundColor: "var(--accent-hex)", color: "#000" }
                          : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }
                      }
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </div>

        {(licenseFieldsOwnerId || isCoach) && (

          <div className={cardCls}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={sectionTitleCls + " mb-0"}>{t("profileLicensesTitle" as any)}</h2>
            </div>

            {licenseFields.length === 0 && !isCoach && (
              <p className="text-sm text-white/50 py-2">
                {t("profileLicensesNoFields" as any)}
              </p>
            )}

            <div className="space-y-4">
              {licenseFields.map((f) => {
                const v = licenseValues[f.id] || {};
                return (
                  <div key={f.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs uppercase tracking-wider text-white/55 truncate">{f.field_name}</p>
                      {isCoach && (
                        <button
                          type="button"
                          onClick={() => removeLicenseField(f.id)}
                          className="text-xs text-white/40 hover:text-red-400 px-2 py-1"
                          aria-label="Fjern felt"
                        >
                          Fjern
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Værdi / nummer">
                        <Input
                          className={inputCls}
                          value={v.value ?? ""}
                          onChange={(e) => updateLicenseValue(f.id, { value: e.target.value })}
                          placeholder="f.eks. DTaF-12345"
                        />
                      </Field>
                      <Field label={t("profileLicenseExpires" as any)}>
                        <Input
                          type="date"
                          className={inputCls}
                          value={v.expires_at ?? ""}
                          onChange={(e) => updateLicenseValue(f.id, { expires_at: e.target.value || null })}
                        />
                      </Field>
                    </div>
                  </div>
                );
              })}
            </div>

            {isCoach && licenseFields.length < 3 && (
              <div className="mt-4 flex gap-2">
                <Input
                  className={inputCls}
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Nyt feltnavn (f.eks. GAL-licens)"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLicenseField(); } }}
                />
                <Button
                  type="button"
                  onClick={addLicenseField}
                  disabled={!newFieldName.trim()}
                  className="text-black font-medium shrink-0"
                  style={{ backgroundColor: "var(--accent-hex)" }}
                >
                  Tilføj
                </Button>
              </div>
            )}

            <p className="text-xs text-white/40 pt-3">
              {isCoach
                ? "Du definerer selv hvilke licens- og registreringsfelter der vises."
                : t("profileLicensesFooter" as any)}
            </p>
          </div>
        )}



        <div className={cardCls}>
          <h2 className={sectionTitleCls}>{t("profileGoalsTitle" as any)}</h2>
          <Field label={t("profileGoalsTitle" as any)}>
            <Input
              className={inputCls}
              value={goalsText}
              onChange={(e) => setGoalsText(e.target.value)}
              placeholder="goal1, goal2, ..."
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-white/45">{label}</Label>
      {children}
    </div>
  );
}
