import { useEffect, useState } from "react";
import { Megaphone, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface AnnouncementRow {
  id?: string;
  text_en: string;
  text_da: string;
  text_sv: string;
  text_de: string;
  text_ar: string;
  text_no: string;
  link_url: string;
  is_active: boolean;
}

const EMPTY: AnnouncementRow = {
  text_en: "",
  text_da: "",
  text_sv: "",
  text_de: "",
  text_ar: "",
  text_no: "",
  link_url: "/help#changelog",
  is_active: false,
};

const LANG_FIELDS: { key: keyof AnnouncementRow; label: string }[] = [
  { key: "text_en", label: "English" },
  { key: "text_da", label: "Dansk" },
  { key: "text_sv", label: "Svenska" },
  { key: "text_de", label: "Deutsch" },
  { key: "text_ar", label: "العربية" },
  { key: "text_no", label: "Norsk" },
];

export const AnnouncementEditor = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [row, setRow] = useState<AnnouncementRow>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("landing_announcements")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setRow(data as AnnouncementRow);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Deactivate all others if marking active (only one active at a time)
      if (row.is_active) {
        await supabase
          .from("landing_announcements")
          .update({ is_active: false })
          .neq("id", row.id ?? "00000000-0000-0000-0000-000000000000");
      }

      if (row.id) {
        const { error } = await supabase
          .from("landing_announcements")
          .update({
            text_en: row.text_en,
            text_da: row.text_da,
            text_sv: row.text_sv,
            text_de: row.text_de,
            text_ar: row.text_ar,
            text_no: row.text_no,
            link_url: row.link_url || "/help#changelog",
            is_active: row.is_active,
          })
          .eq("id", row.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("landing_announcements")
          .insert({
            text_en: row.text_en,
            text_da: row.text_da,
            text_sv: row.text_sv,
            text_de: row.text_de,
            text_ar: row.text_ar,
            text_no: row.text_no,
            link_url: row.link_url || "/help#changelog",
            is_active: row.is_active,
          })
          .select()
          .single();
        if (error) throw error;
        if (data) setRow(data as AnnouncementRow);
      }

      toast({ title: t("announcementSaved") });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Collapsible defaultOpen={false}>
      <div className="rounded-lg border border-energy/30 bg-energy/5 p-4">
        <CollapsibleTrigger asChild>
          <button className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-energy" />
              <span className="font-semibold text-sm text-foreground">
                {t("landingAnnouncement")}
              </span>
              {row.is_active && (
                <span className="text-[10px] uppercase tracking-wider font-bold text-energy">
                  {t("active")}
                </span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-3">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {t("landingAnnouncementHelp")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {LANG_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs">{f.label}</Label>
                    <Input
                      maxLength={80}
                      value={row[f.key] as string}
                      onChange={(e) =>
                        setRow({ ...row, [f.key]: e.target.value })
                      }
                      placeholder="Match video analysis"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("linkUrl")}</Label>
                <Input
                  value={row.link_url}
                  onChange={(e) => setRow({ ...row, link_url: e.target.value })}
                  placeholder="/help#changelog"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                <Label htmlFor="ann-active" className="text-sm cursor-pointer">
                  {t("showOnLanding")}
                </Label>
                <Switch
                  id="ann-active"
                  checked={row.is_active}
                  onCheckedChange={(v) => setRow({ ...row, is_active: v })}
                />
              </div>
              <Button onClick={handleSave} disabled={saving} size="sm" className="w-full">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" /> {t("save")}
                  </>
                )}
              </Button>
            </>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
