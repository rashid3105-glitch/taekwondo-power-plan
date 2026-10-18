import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LandingLayout } from "@/components/landing/LandingLayout";
import { PageMeta } from "@/components/PageMeta";
import { useLanguage } from "@/i18n/LanguageContext";
import { listPublishedPosts, type BlogPost, type BlogLocale } from "@/lib/blogApi";

const GOLD = "hsl(var(--primary))";

const COPY = {
  da: {
    tag: "BLOG",
    title: "Indsigter & artikler",
    sub: "Talentudvikling, coaching og sportsvidenskab — fra Sportstalent-teamet.",
    empty: "Ingen artikler endnu. Kom snart tilbage.",
    readMore: "Læs artikel →",
  },
  en: {
    tag: "BLOG",
    title: "Insights & articles",
    sub: "Talent development, coaching and sports science — from the Sportstalent team.",
    empty: "No articles yet. Check back soon.",
    readMore: "Read article →",
  },
};

const Blog = () => {
  const navigate = useNavigate();
  const { locale: appLocale } = useLanguage();
  const locale: BlogLocale = appLocale === "en" ? "en" : "da";

  const t = COPY[locale];
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listPublishedPosts(locale)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [locale]);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: t.title,
    description: t.sub,
    url: "https://sportstalent.dk/blog",
    inLanguage: locale,
    publisher: { "@type": "Organization", name: "Sportstalent", url: "https://sportstalent.dk" },
    blogPost: posts.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `https://sportstalent.dk/blog/${p.slug}`,
      datePublished: p.published_at || undefined,
    })),
  };

  return (
    <LandingLayout>
      <PageMeta
        title={`${t.title} · Sportstalent`}
        description={t.sub}
        canonical="https://sportstalent.dk/blog"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }} />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 20px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.2em", color: GOLD, marginBottom: 16 }}>
            {t.tag}
          </div>
          <h1 style={{ fontSize: "64px", fontWeight: 900, letterSpacing: "0", lineHeight: 1.05, marginBottom: 16 }}>
            {t.title}
          </h1>
          <p style={{ fontSize: 16, color: "hsl(var(--muted-foreground))", lineHeight: 1.6, maxWidth: 520, margin: "0 auto" }}>
            {t.sub}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "hsl(var(--muted-foreground))", padding: 60 }}>…</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", color: "hsl(var(--muted-foreground))", padding: 80, border: "0.5px dashed hsl(var(--border))", borderRadius: 16 }}>
            {t.empty}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {posts.map((p) => (
              <article
                key={p.id}
                onClick={() => navigate(`/blog/${p.slug}`)}
                style={{
                  background: "hsl(var(--muted))",
                  border: "0.5px solid hsl(var(--border))",
                  borderRadius: 8,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "border-color 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary) / 0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
              >
                {p.cover_image_url && (
                  <img
                    src={p.cover_image_url}
                    alt=""
                    style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
                  />
                )}
                <div style={{ padding: "18px 20px 20px" }}>
                  {p.published_at && (
                    <div style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", marginBottom: 8, letterSpacing: "0.05em" }}>
                      {new Date(p.published_at).toLocaleDateString(locale === "da" ? "da-DK" : "en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  )}
                  <h2 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, margin: "0 0 10px", letterSpacing: "0" }}>{p.title}</h2>
                  {p.excerpt && (
                    <p style={{ fontSize: 13.5, color: "hsl(var(--muted-foreground))", lineHeight: 1.6, margin: "0 0 14px" }}>{p.excerpt}</p>
                  )}
                  <div style={{ fontSize: 13, color: GOLD, fontWeight: 700 }}>{t.readMore}</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </LandingLayout>
  );
};

export default Blog;
