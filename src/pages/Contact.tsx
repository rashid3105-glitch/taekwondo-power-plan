import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PublicNav } from "@/components/PublicNav";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Contact() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("contact_submissions")
        .insert({ name: name.trim(), email: email.trim(), message: message.trim() });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: t("error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageMeta
        title="Contact — Sportstalent"
        description="Get in touch with the Sportstalent team. Questions, partnerships, or feedback — we'd love to hear from you."
        canonical="https://sportstalent.dk/contact"
      />
      <Watermark />
      <PublicNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="absolute top-0 inset-x-0 mx-auto w-[700px] h-[400px] opacity-15 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, hsl(190 95% 50% / 0.35), transparent 70%)" }}
            aria-hidden="true"
          />
          <div className="relative max-w-3xl mx-auto px-5 pt-14 pb-8 sm:pt-20 sm:pb-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground leading-[1.05]"
            >
              {t("contactHeroTitle")}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-4 text-base text-muted-foreground leading-relaxed max-w-md mx-auto"
            >
              {t("contactHeroDesc")}
            </motion.p>
          </div>
        </section>

        {/* Gradient transition */}
        <div className="h-20 bg-gradient-to-b from-background to-[hsl(210,20%,97%)]" aria-hidden="true" />

        <div className="theme-light-section">
          <section className="max-w-lg mx-auto px-5 pb-16">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-border bg-card p-8 text-center shadow-sm"
              >
                <CheckCircle className="h-12 w-12 text-speed mx-auto mb-4" />
                <h2 className="text-lg font-bold text-card-foreground mb-2">{t("contactSuccessTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("contactSuccessDesc")}</p>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                onSubmit={handleSubmit}
                className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name" className="text-xs font-medium">{t("contactNameLabel")}</Label>
                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("contactNamePlaceholder")}
                    required
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email" className="text-xs font-medium">{t("email")}</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    maxLength={255}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-message" className="text-xs font-medium">{t("contactMessageLabel")}</Label>
                  <Textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("contactMessagePlaceholder")}
                    required
                    maxLength={1000}
                    rows={5}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full font-bold">
                  {loading ? t("pleaseWait") : (
                    <span className="flex items-center gap-1.5">
                      <Send className="h-4 w-4" /> {t("contactSendButton")}
                    </span>
                  )}
                </Button>
              </motion.form>
            )}
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
