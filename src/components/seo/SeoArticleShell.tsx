import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { PublicNav } from "@/components/PublicNav";
import { AppFooter } from "@/components/AppFooter";
import { Watermark } from "@/components/Watermark";
import { PageMeta } from "@/components/PageMeta";
import { PublicSeo } from "@/components/seo/SeoHead";
import { Button } from "@/components/ui/button";

interface RelatedLink {
  to: string;
  title: string;
  desc: string;
}

interface Props {
  title: string;
  description: string;
  canonical: string;
  h1: string;
  intro: ReactNode;
  jsonLd?: Record<string, unknown>;
  children: ReactNode;
  related?: RelatedLink[];
  ctaTitle?: string;
  ctaDesc?: string;
  ctaHref?: string;
  ctaLabel?: string;
  breadcrumbLabel?: string;
}

export function SeoArticleShell({
  title,
  description,
  canonical,
  h1,
  intro,
  jsonLd,
  children,
  related = [],
  ctaTitle = "Kom i gang med Sportstalent",
  ctaDesc = "Byg dit periodiserede taekwondo-program på minutter — tilpasset dit niveau og din ugentlige klubtræning.",
  ctaHref = "/auth",
  ctaLabel = "Opret gratis konto",
  breadcrumbLabel,
}: Props) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageMeta title={title} description={description} canonical={canonical} ogType="article" />
      <Watermark />
      <PublicNav />

      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-5 pt-10 pb-16 sm:pt-14">
          {breadcrumbLabel && (
            <nav aria-label="Brødkrumme" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Sportstalent</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{breadcrumbLabel}</span>
            </nav>
          )}

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1.05]">
            {h1}
          </h1>
          <div className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            {intro}
          </div>

          <div className="mt-10 prose max-w-none prose-headings:font-black prose-headings:tracking-tight prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:underline">
            {children}
          </div>

          {/* CTA */}
          <section className="mt-12 rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">{ctaTitle}</h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">{ctaDesc}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={ctaHref}>
                  {ctaLabel} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/methodology">Se metoden</Link>
              </Button>
            </div>
          </section>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-black tracking-tight text-foreground mb-4">Læs også</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <li key={r.to}>
                    <Link
                      to={r.to}
                      className="group block rounded-xl border border-border/60 bg-card/40 p-4 hover:border-primary/60 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground group-hover:text-primary">{r.title}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-0.5" />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground leading-snug">{r.desc}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>

      <AppFooter />
    </div>
  );
}
