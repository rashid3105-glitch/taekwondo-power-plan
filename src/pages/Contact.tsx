import { trackCta } from "@/lib/ctaTracking";
import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LightLayout as LandingLayout } from "@/components/landing/LightLayout";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { contactOfferLabelKey, parseContactOffer } from "@/lib/contactOffer";

export default function Contact() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const offer = parseContactOffer(searchParams.get("offer"));
  const offerLabel = t(contactOfferLabelKey(offer));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || (offer === "general" && !message.trim())) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-contact", {
        body: { name: name.trim(), email: email.trim(), message: message.trim(), offer },
      });
      if (error || !data?.ok) throw new Error(data?.error === "rate_limited" ? t("contactRequestRateLimit") : t("contactRequestError"));
      setSubmitted(true);
      trackCta("contact_submitted");
    } catch (err: any) {
      toast({ title: t("error"), description: err.message || t("contactRequestError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LandingLayout>
    <div>
    <div className="bg-background flex flex-col relative">
      <PageMeta
        title={t("seoContactTitle")}
        description={t("seoContactDesc")}
        canonical="https://sportstalent.dk/contact"
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="relative max-w-3xl mx-auto px-5 pt-14 pb-8 sm:pt-20 sm:pb-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground leading-[1.05]"
            >
              {offer === "general" ? t("contactHeroTitle") : offerLabel}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-4 text-base text-muted-foreground leading-relaxed max-w-md mx-auto"
            >
              {offer === "general" ? t("contactHeroDesc") : t(offer === "demo" ? "contactDemoNext" : "contactTrialNext")}
            </motion.p>
          </div>
        </section>

        {/* Gradient transition */}

        <div className="">
          <section className="max-w-lg mx-auto px-5 pb-16">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center"
                role="status"
              >
                <CheckCircle className="h-12 w-12 text-speed mx-auto mb-4" />
                <h2 className="text-lg font-bold text-foreground mb-2">{t("contactRequestSaved")}</h2>
                <p className="text-sm font-medium mb-3">{offerLabel}</p>
                <p className="text-sm text-muted-foreground">{t("contactRequestNext")}</p>
                {offer !== "general" && <p className="mt-4 text-sm text-muted-foreground">{t(offer === "demo" ? "contactDemoNext" : "contactTrialNext")}</p>}
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium mb-2">{t("contactOfferLabel")}</legend>
                  <div className="flex flex-wrap gap-2">
                    {(["demo", "trial", "general"] as const).map(value => <Button key={value} type="button" variant={offer === value ? "default" : "outline"} aria-pressed={offer === value} onClick={() => setSearchParams(value === "general" ? {} : { offer: value })}>{t(contactOfferLabelKey(value))}</Button>)}
                  </div>
                </fieldset>
                <div className="border-l-2 border-primary pl-4">
                  <h2 className="text-sm font-semibold">{t("contactNextTitle")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(offer === "demo" ? "contactDemoNext" : offer === "trial" ? "contactTrialNext" : "contactHeroDesc")}</p>
                </div>
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
                  <Label htmlFor="contact-message" className="text-xs font-medium">{t(offer === "general" ? "contactMessageLabel" : "contactOptionalMessage")}</Label>
                  <Textarea
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("contactMessagePlaceholder")}
                    required={offer === "general"}
                    maxLength={1000}
                    rows={5}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full font-bold">
                  {loading ? t("pleaseWait") : (
                    <span className="flex items-center gap-1.5">
                      <Send className="h-4 w-4" /> {t(offer === "demo" ? "contactDemoSend" : offer === "trial" ? "contactTrialSend" : "contactSendButton")}
                    </span>
                  )}
                </Button>
              </motion.form>
            )}
          </section>
        </div>
      </main>
    </div>
    </div>
    </LandingLayout>
  );
}
